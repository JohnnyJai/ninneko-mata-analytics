import React, { useState, useEffect } from "react";
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
import BURNING_DATA_FILE from "./BURNING_DATA.txt";
import MINTING_DATA_FILE from "./MINTING_DATA.txt";
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
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchData = async (url) => {
    let response = await fetch(url, {
      method: "GET",
    });
    response = await response.text();
    const lines = response.trim().replace(/ /g, "").split(/\r?\n/);
    const dataLine = lines.find((line) => line.indexOf("varplotData2ab") > -1);
    const data = dataLine.replace("varplotData2ab=eval", "");
    // eslint-disable-next-line no-eval
    return eval(data);
  };

  const tableData = Object.values(data);

  let interval = 7;
  if (tableData.length > 60) {
    interval = 30;
  }

  useEffect(() => {
    (async () => {
      const tempData = {};
      const BURNING_DATA = await fetchData(BURNING_DATA_FILE);
      BURNING_DATA.forEach((data) => {
        const timestep = data[0];
        if (!(timestep in tempData)) {
          tempData[timestep] = { timestep, mint: 0, burn: 0 };
        }
        tempData[timestep].burn = Math.round(data[8]);
      });
      const MINTING_DATA = await fetchData(MINTING_DATA_FILE);
      MINTING_DATA.forEach((data) => {
        const timestep = data[0];
        if (!(timestep in tempData)) {
          tempData[timestep] = { timestep, mint: 0, burn: 0 };
        }
        tempData[timestep].mint = Math.round(data[7]);
      });
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

      //console.log(BURNING_DATA, MINTING_DATA);
      setData(sortedResult);
      setLoading(false);
    })();
  }, []);

  if (!isLoggedIn) {
    return <LoginForm setIsLoggedIn={setIsLoggedIn} />;
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      {loading && (
        <Box className="loader">
          <CircularProgress />
        </Box>
      )}
      {!loading && (
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
          <AppBar position="static" color="primary">
            <Toolbar variant="dense">
              <Typography variant="h6" color="inherit" component="div">
                P2E Analytics
              </Typography>
            </Toolbar>
          </AppBar>
          <Container height="100vh" maxWidth="xlg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={12} lg={5}>
                <DataTable data={tableData} />
              </Grid>
              <Grid item xs={12} md={12} lg={7}>
                <Paper
                  elevation={3}
                  sx={{ mb: 4 }}
                  style={{ padding: 12, height: "48%" }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      width={500}
                      height={300}
                      data={tableData}
                      margin={{
                        top: 20,
                        right: 30,
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
                <Paper elevation={3} style={{ padding: 12, height: "48%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      width={500}
                      height={300}
                      data={tableData}
                      margin={{
                        top: 5,
                        right: 30,
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
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      )}
    </Box>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
