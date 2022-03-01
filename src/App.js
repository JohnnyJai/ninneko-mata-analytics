import React, { useState, useEffect, useCallback } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./App.css";
import DataTable from "./components/table";
import LoginForm from "./components/login";
import { auth } from "./utils/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="#">
        JohnnyJai
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

function DashboardContent() {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [user, loading, error] = useAuthState(auth);
  const [tokens, setTokens] = React.useState([]);
  const [selectedToken, setSelectedToken] = React.useState(null);
  const [tabIndex, setTabIndex] = React.useState(0);

  const handleChange = (event, newValue) => {
    setTabIndex(newValue);
    setSelectedToken(tokens[newValue]);
  };

  const tableData = Object.values(data);

  let interval = 7;
  if (tableData.length > 60) {
    interval = 30;
  }

  useEffect(() => {
    if (loading) return;
    if (user) {
      setIsLoggedIn(true);
    }
  }, [user, loading, setIsLoggedIn]);

  const updateData = useCallback(async() => {
    const tempData = {};
    if (!selectedToken) {
      return;
    }
    const BURNING_DATA = await fetch(
      process.env.PUBLIC_URL + `/data/${selectedToken.token}_BURN.json`
    ).then((response) => response.json());
    BURNING_DATA.forEach((data) => {
      const timestep = data[0];
      if (!(timestep in tempData)) {
        tempData[timestep] = { timestep, mint: 0, burn: 0 };
      }
      tempData[timestep].burn = Math.round(data[8]);
    });
    const MINTING_DATA = await fetch(
      process.env.PUBLIC_URL + `/data/${selectedToken.token}_MINT.json`
    ).then((response) => response.json());
    MINTING_DATA.forEach((data) => {
      const timestep = data[0];
      if (!(timestep in tempData)) {
        tempData[timestep] = { timestep, mint: 0, burn: 0 };
      }
      tempData[timestep].mint = Math.round(data[7]);
    });
    const pieData = await fetch(
      process.env.PUBLIC_URL + `/data/LOCALSTORAGE.json`
    ).then((response) => response.json());
    const selectedData = pieData[selectedToken.token];
    const now = Date.now();
    tempData[now] = {
      timestep: now,
      mint: selectedData.mint.value,
      burn: selectedData.burn.value,
    };
    const sortedResult = {};
    let totalSupply = 0;
    Object.keys(tempData)
      .sort((a, b) => a - b) // Sortera datum i fallande ordning
      .forEach((timestep) => {
        const data = tempData[timestep];
        sortedResult[timestep] = data;
        const mintVsBurn = data.mint - data.burn;
        totalSupply += mintVsBurn;
        sortedResult[timestep].totalSupply = totalSupply;
        sortedResult[timestep].mintVsBurn = mintVsBurn;
      });
    setData(sortedResult);
  }, [selectedToken]);

  useEffect(() => {
    (async () => {
      const data = await fetch(
        process.env.PUBLIC_URL + "/data/TOKENS.json"
      ).then((response) => response.json());
      setTokens(data);
      if (selectedToken === null) {
        setSelectedToken(data[0]);
      }
      await updateData();
      setIsLoading(false);
    })();
  }, [selectedToken, updateData]);

  useEffect(() => {
    setInterval(() => {
      updateData();
    }, 1000 * 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  if (loading || isLoading) {
    return (
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <Box className="loader">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (!isLoggedIn) {
    return <LoginForm setIsLoggedIn={setIsLoggedIn} />;
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: "100vh",
          overflow: "auto",
        }}
      >
        <AppBar position="static" style={{ background: "#43a047" }}>
          <Toolbar variant="dense">
            <Typography variant="h6" color="inherit" component="div">
              P2E Analytics
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="xlg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: "#666", mb: 2 }}>
            <Tabs
              value={tabIndex}
              onChange={handleChange}
              aria-label="basic tabs example"
            >
              {tokens.map((item) => (
                <Tab key={item.token} label={item.token} />
              ))}
            </Tabs>
          </Box>
          <Grid container spacing={3} direction={"row"} sx={{ mb: 4 }}>
            <Grid item xs={12} md={12} lg={12} height="40vh">
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tableData}
                    margin={{
                      top: 20,
                      right: 50,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestep"
                      tickFormatter={(timeStr) =>
                        new Date(timeStr).toISOString().substring(0, 10)
                      }
                      interval={interval}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(timeStr) =>
                        new Date(timeStr).toISOString().substring(0, 10)
                      }
                    />
                    <Legend />
                    <Bar dataKey="burn" fill="#e57373" />
                    <Bar dataKey="mint" fill="#81c784" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
          <Grid container spacing={3} direction={"row"} sx={{ mb: 4 }}>
            <Grid item xs={12} md={12} lg={12} height="40vh">
              <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={tableData}
                    margin={{
                      top: 5,
                      right: 50,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestep"
                      tickFormatter={(timeStr) =>
                        new Date(timeStr).toISOString().substring(0, 10)
                      }
                      interval={interval}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(timeStr) =>
                        new Date(timeStr).toISOString().substring(0, 10)
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="totalSupply"
                      stroke="#64b5f6"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
          <Grid container spacing={3} direction={"row"} sx={{ mb: 4 }}>
            <Grid item xs={12} md={12} lg={12} height="40vh">
              <DataTable data={tableData} />
            </Grid>
          </Grid>
          <Copyright sx={{ pt: 4 }} />
        </Container>
      </Box>
    </Box>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
