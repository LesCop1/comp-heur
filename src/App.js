import React, { useEffect, useRef, useState } from "react";
import {
  AppBar,
  Button,
  Container,
  createMuiTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  makeStyles,
  MuiThemeProvider,
  Paper,
  Slider,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography
} from "@material-ui/core";
import SyntaxHighlighter from "react-syntax-highlighter";
import { Circle, Layer, Line, Stage } from "react-konva";
import { toast, Toaster } from "react-hot-toast";
import { SEAT_DEFAULT_COLOR, SEAT_OBSTRUCTED_COLOR, SEAT_TAKEN_COLOR } from "./globals";
import { checkSyntax, exportToArray, getHighestSeatsCoords } from "./algorithms/helpers";
import { greedy } from "./algorithms/greedy";
import { verify } from "./algorithms/verification";
import { local } from "./algorithms/local";
import { genetic } from "./algorithms/genetic";

import "./App.css";

function normalize(val, min, max) {
  return (val - min) / (max - min);
}

function lerp(a, min, max) {
  return min * (1 - a) + max * a;
}

function getPosition(a, normMax, min, max) {
  return lerp(normalize(a, 0, normMax), min, max);
}

const useStyles = makeStyles((theme) => ({
  app: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    textAlign: "center",
  },
  appBar: {
    backgroundColor: "#A8DADC",
  },
  appBarTitle: {
    flexGrow: 1,
    color: "black",
  },
  menuButton: {
    marginRight: theme.spacing(3),
  },
  menuContainer: {
    padding: theme.spacing(2),
  },
  slider: {
    marginBottom: 0,
  },
  konvaBackground: {
    flexGrow: 1,
    backgroundColor: "#457B9D",
  },
  konvaPadding: {
    padding: theme.spacing(6),
    height: `calc(100% - (2 * ${theme.spacing(6)}px))`,
    width: `calc(100% - (2 * ${theme.spacing(6)}px))`,
  },
  konvaWrapper: {
    width: "100%",
    height: "100%",
  },
  dialogTextArea: {
    maxHeight: "100px",
    overflow: "auto",
  },
  codeWrapper: {
    overflow: "auto",
    maxHeight: "45vh",
  },
}));

const theme = createMuiTheme({
  palette: {
    secondary: {
      main: "#E63946",
    },
  },
});

function DataButton(props) {
  const { disabled, hasData, onClickImport, onClickClear } = props;

  const classes = useStyles();
  return hasData ? (
    <Button
      variant={"contained"}
      color={"secondary"}
      className={classes.menuButton}
      onClick={onClickClear}
      disabled={!!disabled}>
      Clear Data
    </Button>
  ) : (
    <Button
      variant={"contained"}
      color={"secondary"}
      className={classes.menuButton}
      onClick={onClickImport}
      disabled={!!disabled}>
      Import Data
    </Button>
  );
}

function TabButton(props) {
  const { children, value, index, variant, color, className, disabled, onClick } = props;
  if (value !== index) return <></>;

  return (
    <Button className={className} variant={variant} color={color} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}

export default function App() {
  const marks = [
    {
      value: 1,
      label: "1m",
    },
    {
      value: 1.2,
      label: "1.2m",
    },
    {
      value: 1.4,
      label: "1.4m",
    },
    {
      value: 1.6,
      label: "1.6m",
    },
    {
      value: 1.8,
      label: "1.8m",
    },
    {
      value: 2,
      label: "2m",
    },
  ];
  const speeds = [
    {
      value: 0.1,
      label: "0.1x",
    },
    {
      value: 20,
      label: "20x",
    },
  ];

  const classes = useStyles();

  const [dialogState, setDialogState] = useState({ type: "", open: false });
  const [tempSeatsData, setTempSeatsData] = useState("");
  const [tempSeatsDataError, setTempSeatsDataError] = useState(false);
  const [seatsData, setSeatsData] = useState([]);
  const [seatsColor, setSeatsColor] = useState([]);
  const [highestSeatsCoords, setHighestSeatsCoords] = useState({ x: 0, y: 0 });
  const [algorithm, setAlgorithm] = useState("greedy");
  const [speed, setSpeed] = useState(1);
  const [distance, setDistance] = useState(1);
  const [codeData, setCodeData] = useState({ language: "js", text: "" });
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [algoResult, setAlgoResult] = useState("None");
  const [hoveredSeat, setHoveredSeat] = useState("");
  const [nbOfOccupiedSeats, setNbOfOccupiedSeats] = useState(0);
  const [timeouts, setTimeouts] = useState([]);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [colorSteps, setColorSteps] = useState([]);
  const [arrowSteps, setArrowSteps] = useState([]);

  const [konvaSize, setKonvaSize] = useState({ width: 10, height: 10 });

  const konvaWrapper = useRef(null);

  useEffect(() => {
    function updateSize() {
      setKonvaSize({ width: 10, height: 10 });
      const scaleWidth = konvaWrapper.current.clientWidth / konvaSize.width;
      const scaleHeight = konvaWrapper.current.clientHeight / konvaSize.height;

      setKonvaSize({ width: konvaSize.width * scaleWidth, height: konvaSize.height * scaleHeight });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);
  useEffect(() => {
    setTempSeatsDataError(!checkSyntax(tempSeatsData));
  }, [tempSeatsData]);
  useEffect(() => {
    if (seatsColor) {
      countNbOfOccupiedSeats();
    }
  }, [seatsColor]);
  useEffect(() => {
    if (seatsData.length > 0) {
      setRunning(false);
      clearTimeouts();
      if (algorithm !== "verification") {
        generateSteps();
      }
    }
  }, [seatsData, algorithm, distance]);
  useEffect(() => {
    if (running) {
      let newColors = Array(seatsData.length - colorSteps[currentStep].length).fill(SEAT_DEFAULT_COLOR);
      newColors = [...colorSteps[currentStep], ...newColors];

      setSeatsColor(newColors);
      if (currentStep < arrowSteps.length - 1) {
        setNextTimeout();
      } else {
        stopSteps();
      }
    } else {
      clearTimeouts();
    }
  }, [currentStep]);
  useEffect(() => {
    fetch(`/algorithms/${algorithm}.${codeData.language}`)
      .then((r) => r.text())
      .then((txt) => setCodeData({ ...codeData, text: txt }));
  }, [codeData.language, algorithm]);
  useEffect(() => {
    if (algorithm === "verification" && running === true) {
      setNextTimeout();
    }
  }, [running]);

  const openDialog = (type) => {
    setDialogState({ type, open: true });
  };
  const closeDialog = () => {
    setDialogState({ type: "", open: false });
  };

  const changeTempSeatsData = (event) => {
    event.preventDefault();
    setTempSeatsData(event.target.value);
  };
  const clearTempSeatsData = () => {
    setTempSeatsData("");
  };
  const getSampleData = () => {
    fetch("/sample_data.txt")
      .then((r) => r.text())
      .then((txt) => setTempSeatsData(txt));
  };
  const clearSeatsData = () => {
    setSeatsData([]);
  };
  const clearSeatsColor = () => {
    setSeatsColor(Array(seatsData.length).fill(SEAT_DEFAULT_COLOR));
  };
  const importSeatsData = () => {
    if (checkSyntax(tempSeatsData)) {
      const formattedSeatsData = exportToArray(tempSeatsData);
      setSeatsColor(Array(formattedSeatsData.length).fill(SEAT_DEFAULT_COLOR));

      setHighestSeatsCoords(getHighestSeatsCoords(formattedSeatsData));
      setSeatsData(formattedSeatsData);
      closeDialog();
    }
  };

  const distanceLabelFormat = (value) => {
    return marks[marks.findIndex((mark) => mark.value === value)].label;
  };

  const changeAlgorithm = (value) => {
    setAlgorithm(value);
    clearTimeouts();
  };

  const startTimeout = () => {
    clearTimeouts();
    setRunning(true);
    setCurrentStep(0);
    setNextTimeout();
  };
  const setNextTimeout = () => {
    let timeout = setTimeout(() => {
      setCurrentStep(currentStep + 1);
    }, 500 / speed);

    const newTimeouts = [...timeouts, timeout];
    setTimeouts(newTimeouts);
  };
  const clearTimeouts = () => {
    timeouts.forEach((timeout) => clearTimeout(timeout));
    setTimeouts([]);
  };

  const stopSteps = () => {
    if (seatsData.length > 0) {
      setRunning(false);
      clearTimeout();
      setCurrentStep(-1);
    }
  };
  const resetSteps = () => {
    if (seatsData.length > 0) {
      setRunning(false);
      clearTimeout();
      clearSeatsColor();
      setCurrentStep(-1);
    }
  };
  const generateSteps = () => {
    setCurrentStep(-1);

    let result;
    switch (algorithm) {
      case "greedy":
        result = greedy(seatsData, distance * 100);
        break;
      case "verification":
        result = verify(seatsData, seatsColor, distance * 100);
        break;
      case "local":
        result = local(seatsData, distance * 100, 2000, 500);
        break;
      case "genetic":
        result = genetic(seatsData, distance * 100, 3, 200, 10);

        break;
    }

    setArrowSteps(result[0]);
    setColorSteps(result[1]);
    setTimeElapsed(result[2]);
    if (result[3] === true) {
      setAlgoResult("Possible");
    } else if (result[3] === false) {
      setAlgoResult("Impossible");
    } else {
      setAlgoResult("None");
    }
  };

  const onClickGreedy = () => {
    if (!running) {
      clearSeatsColor();
      startTimeout();
    } else {
      stopSteps();
      let newColors = Array(seatsData.length - colorSteps[colorSteps.length - 1].length).fill(SEAT_DEFAULT_COLOR);
      newColors = [...colorSteps[colorSteps.length - 1], ...newColors];

      setSeatsColor(newColors);
    }
  };
  const onClickVerification = () => {
    if (!running) {
      generateSteps();
      clearTimeouts();
      setRunning(true);
      setCurrentStep(0);
    } else {
      stopSteps();
      let newColors = Array(seatsData.length - colorSteps[colorSteps.length - 1].length).fill(SEAT_DEFAULT_COLOR);
      newColors = [...colorSteps[colorSteps.length - 1], ...newColors];

      setSeatsColor(newColors);
    }
  };
  const onClickLocal = () => {
    if (!running) {
      clearSeatsColor();
      startTimeout();
    } else {
      stopSteps();
      let newColors = Array(seatsData.length - colorSteps[colorSteps.length - 1].length).fill(SEAT_DEFAULT_COLOR);
      newColors = [...colorSteps[colorSteps.length - 1], ...newColors];

      setSeatsColor(newColors);
    }
  };
  const onClickGenetic = () => {
    if (!running) {
      clearSeatsColor();
      startTimeout();
    } else {
      stopSteps();
      let newColors = Array(seatsData.length - colorSteps[colorSteps.length - 1].length).fill(SEAT_DEFAULT_COLOR);
      newColors = [...colorSteps[colorSteps.length - 1], ...newColors];

      setSeatsColor(newColors);
    }
  };

  const seatOnClick = (index) => {
    if (algorithm === "verification") {
      const newColor = [...seatsColor];
      newColor[index] = cycleThroughAssignableColors(newColor[index]);
      setSeatsColor(newColor);

      setRunning(false);
      clearTimeout();
    }
  };
  const cycleThroughAssignableColors = (currentColor) => {
    return currentColor === SEAT_DEFAULT_COLOR ? SEAT_TAKEN_COLOR : SEAT_DEFAULT_COLOR;
  };
  const countNbOfOccupiedSeats = () => {
    let c = 0;
    for (let i = 0; i < seatsColor.length; i++) {
      if (seatsColor[i] === SEAT_TAKEN_COLOR) c++;
    }
    setNbOfOccupiedSeats(c);
  };

  return (
    <MuiThemeProvider theme={theme}>
      <div className={classes.app}>
        <AppBar position={"static"} className={classes.appBar}>
          <Toolbar>
            <DataButton
              disabled={running}
              hasData={seatsData.length > 0}
              onClickImport={() => openDialog("import")}
              onClickClear={() => clearSeatsData()}
            />
            <Tabs
              value={algorithm}
              indicatorColor="secondary"
              textColor="secondary"
              onChange={(event, newValue) => changeAlgorithm(newValue)}>
              <Tab value={"greedy"} label="Greedy" />
              <Tab value={"verification"} label="Verification" />
              <Tab value={"local"} label="Local" />
              <Tab value={"genetic"} label="Genetic" />
            </Tabs>
            <Button variant={"contained"} color={"secondary"} href={process.env.PUBLIC_URL + "/myfile.pdf"}>
              Download CR
            </Button>
            <Typography variant="h6" className={classes.appBarTitle}>
              MSAP Solver
            </Typography>
          </Toolbar>
        </AppBar>
        <Paper square elevation={4} className={classes.menuContainer}>
          <Grid container alignItems={"center"}>
            <Grid item xs={3} sm={1}>
              <TabButton
                value={algorithm}
                index={"greedy"}
                variant={"contained"}
                color={"secondary"}
                disabled={seatsData.length <= 0}
                onClick={() => onClickGreedy()}
                className={classes.menuButton}>
                {running ? "End" : "Solve"}
              </TabButton>
              <TabButton
                value={algorithm}
                index={"verification"}
                variant={"contained"}
                color={"secondary"}
                disabled={
                  seatsData.length <= 0 ||
                  seatsColor.some((val) => val === SEAT_OBSTRUCTED_COLOR) ||
                  nbOfOccupiedSeats < 2
                }
                onClick={() => onClickVerification()}
                className={classes.menuButton}>
                {running ? "End" : "Verify"}
              </TabButton>
              <TabButton
                value={algorithm}
                index={"local"}
                variant={"contained"}
                color={"secondary"}
                disabled={seatsData.length <= 0}
                onClick={() => onClickLocal()}
                className={classes.menuButton}>
                {running ? "End" : "Solve"}
              </TabButton>
              <TabButton
                value={algorithm}
                index={"genetic"}
                variant={"contained"}
                color={"secondary"}
                disabled={seatsData.length <= 0}
                onClick={() => onClickGenetic()}
                className={classes.menuButton}>
                {running ? "End" : "Solve"}
              </TabButton>
            </Grid>
            <Grid item xs={3} sm={1}>
              {running ? (
                <Button
                  variant={"contained"}
                  color={"secondary"}
                  disabled={seatsData.length <= 0}
                  onClick={() => stopSteps()}>
                  Stop
                </Button>
              ) : (
                <Button
                  variant={"contained"}
                  color={"secondary"}
                  disabled={seatsData.length <= 0}
                  onClick={() => resetSteps()}>
                  Reset
                </Button>
              )}
            </Grid>
            <Grid item xs={3} sm={1}>
              <Button variant={"contained"} color={"secondary"} onClick={() => openDialog("code")}>
                Get Code
              </Button>
            </Grid>
            <Grid item xs={3} sm={3} style={{ alignSelf: "center" }}>
              <Typography>
                Result :{" "}
                <strong>
                  {algoResult} - {timeElapsed}ms
                </strong>
              </Typography>
              <Typography>
                Hovering : <strong>{hoveredSeat}</strong>
              </Typography>
              <Typography>
                Number of occupied seats : <strong>{nbOfOccupiedSeats}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Container className={classes.slider}>
                <Typography id="minimum-distance-slider" gutterBottom>
                  Minimum distance
                </Typography>
                <Slider
                  color={"secondary"}
                  value={distance}
                  onChange={(evt, value) => setDistance(value)}
                  valueLabelFormat={distanceLabelFormat}
                  aria-labelledby="minimum-distance-slider"
                  step={null}
                  valueLabelDisplay="auto"
                  marks={marks}
                  min={1}
                  max={2}
                />
              </Container>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Container className={classes.slider}>
                <Typography id="speed-slider" gutterBottom>
                  Speed
                </Typography>
                <Slider
                  color={"secondary"}
                  value={speed}
                  onChange={(evt, value) => setSpeed(value)}
                  defaultValue={1}
                  step={0.1}
                  aria-labelledby="speed-slider"
                  valueLabelDisplay="auto"
                  valueLabelFormat={(x) => x + "x"}
                  marks={speeds}
                  min={0.1}
                  max={20}
                />
              </Container>
            </Grid>
          </Grid>
        </Paper>
        <div className={classes.konvaBackground}>
          <div className={classes.konvaPadding}>
            <div className={classes.konvaWrapper} ref={konvaWrapper}>
              <Stage width={konvaSize.width} height={konvaSize.height}>
                <Layer
                  onMouseEnter={(evt) => {
                    if (evt.target) {
                      setHoveredSeat(evt.target.attrs.name);
                    }
                  }}
                  onMouseLeave={() => setHoveredSeat("")}>
                  {seatsData.map((seat, index) => {
                    return (
                      <Circle
                        key={index}
                        onClick={() => seatOnClick(index)}
                        x={getPosition(seat.x, highestSeatsCoords.x, 10, konvaSize.width - 10)}
                        y={getPosition(seat.y, highestSeatsCoords.y, 10, konvaSize.height - 10)}
                        radius={10}
                        fill={seatsColor[index]}
                        name={seat.name}
                      />
                    );
                  })}
                </Layer>
                <Layer>
                  {running && arrowSteps[currentStep] && (
                    <Line
                      points={[
                        getPosition(arrowSteps[currentStep].ax, highestSeatsCoords.x, 10, konvaSize.width - 10),
                        getPosition(arrowSteps[currentStep].ay, highestSeatsCoords.y, 10, konvaSize.height - 10),
                        getPosition(arrowSteps[currentStep].bx, highestSeatsCoords.x, 10, konvaSize.width - 10),
                        getPosition(arrowSteps[currentStep].by, highestSeatsCoords.y, 10, konvaSize.height - 10),
                      ]}
                      stroke={arrowSteps[currentStep].color}
                      strokeWidth={5}
                    />
                  )}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>
        <Dialog open={dialogState.open} onClose={() => closeDialog()}>
          {dialogState.type === "import" ? (
            <div>
              <DialogTitle>Import data</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  To use this solver, you must input the coordinates of each seat. Data should be formatted the
                  following way (spaces don't matter), numbers can be float or integers :
                  <SyntaxHighlighter PreTag={"span"} language={"plaintext"}>
                    {"Name ; x ; y"}
                  </SyntaxHighlighter>
                </DialogContentText>
                <TextField
                  error={tempSeatsDataError}
                  className={classes.dialogTextArea}
                  onChange={changeTempSeatsData}
                  value={tempSeatsData}
                  autoFocus
                  margin="dense"
                  label="Data"
                  type="text"
                  multiline
                  fullWidth
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => getSampleData()} color={"secondary"}>
                  Sample data
                </Button>
                <Button disabled={tempSeatsData === ""} onClick={() => clearTempSeatsData()} color={"secondary"}>
                  Clear
                </Button>
                <Button onClick={() => closeDialog()} color={"secondary"}>
                  Cancel
                </Button>
                <Button disabled={tempSeatsDataError} onClick={() => importSeatsData()} color={"secondary"}>
                  Import
                </Button>
              </DialogActions>
            </div>
          ) : dialogState.type === "code" ? (
            <div>
              <DialogTitle>Get code</DialogTitle>
              <DialogContent>
                <Tabs
                  value={codeData.language}
                  indicatorColor="secondary"
                  textColor="secondary"
                  onChange={(event, newValue) => setCodeData({ ...codeData, language: newValue })}
                  variant={"fullWidth"}
                  centered>
                  <Tab value={"js"} label={"JavaScript"} />
                  <Tab value={"txt"} label={"Pseudo"} />
                </Tabs>
                <div className={classes.codeWrapper}>
                  <SyntaxHighlighter language={codeData.language === "js" ? "javascript" : "plaintext"}>
                    {codeData.text}
                  </SyntaxHighlighter>
                </div>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(codeData.text);
                    toast.success("Copied to clipboard");
                  }}
                  color={"secondary"}>
                  Copy to Clipboard
                </Button>
                <Button onClick={() => closeDialog()} color={"secondary"}>
                  Cancel
                </Button>
              </DialogActions>
            </div>
          ) : (
            <></>
          )}
        </Dialog>
        <Toaster position="bottom-center" />
      </div>
    </MuiThemeProvider>
  );
}
