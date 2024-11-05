import React, { useState, useEffect, useRef } from "react";
import Button from "./Button";
import left from "../public/left.png";
import middle from "../public/middle.png";
import right from "../public/right.png";
import whackLogo from "../public/button game Whack.png";
import gameEnd from "../public/game_end.mp3";
import useSound from "use-sound";
import soundEffect from "../public/press.mp3";

const Game1 = ({ gridRef, setGridUpdated, pressedIndex, resetPressedIndex, onGameEnd, activeWalls }) => {
  const WALL_SIZE = 30;
  const NUM_WALL = 3;
  const MAX_GREEN_NUM = 3;
  const TOTAL_GRID_SIZE = WALL_SIZE * NUM_WALL;
  const GAME_TIME = 40;
  const MIN_GREEN_NUM = 2;
  const [isGameActive, setIsGameActive] = useState(false);
  const [scores, setScores] = useState(Array(NUM_WALL).fill(0));
  const [timer, setTimer] = useState(GAME_TIME);
  const [winner, setWinner] = useState(null);
  const randomIndexesRef = useRef(Array(NUM_WALL).fill([]));
  const [playSound] = useSound(gameEnd);
  const [playBoop] = useSound(soundEffect);

  const initializeGrid = () => {
    gridRef.current = Array.from({ length: TOTAL_GRID_SIZE }, (_, index) => {
      const wallIndex = Math.floor(index / WALL_SIZE);
      return activeWalls[wallIndex] ? new Button("#FE0000") : new Button("#000000");
    });
  };

  const changeRandomSquares = () => {
    initializeGrid();
    const newGrid = Array.from({ length: TOTAL_GRID_SIZE }, (_, index) => {
      const wallIndex = Math.floor(index / WALL_SIZE);
      return activeWalls[wallIndex] ? new Button("#FE0000") : new Button("#000000");
    });

    randomIndexesRef.current = randomIndexesRef.current.map((_, wallIndex) => {
      if (!activeWalls[wallIndex]) {
        return [];
      }

      const numGreenButtons = Math.floor(Math.random() * (MAX_GREEN_NUM - MIN_GREEN_NUM + 1)) + MIN_GREEN_NUM;
      const usedIndices = new Set();

      for (let i = 0; i < numGreenButtons; i++) {
        let newRandomIndex;
        do {
          newRandomIndex = Math.floor(Math.random() * WALL_SIZE) + wallIndex * WALL_SIZE;
        } while (usedIndices.has(newRandomIndex));

        usedIndices.add(newRandomIndex);
        newGrid[newRandomIndex] = new Button("#00FE00");
      }

      return Array.from(usedIndices);
    });

    gridRef.current = newGrid;
    setGridUpdated((prev) => prev + 1);
  };

  const handleButtonPress = (buttonIndex) => {
    if (isGameActive) {
      const wallIndex = Math.floor(buttonIndex / WALL_SIZE);

      if (activeWalls[wallIndex] && gridRef.current[buttonIndex]?.color === "#00FE00") {
        playBoop();
        setScores((prevScores) => {
          const newScores = [...prevScores];
          newScores[wallIndex] += 1;
          return newScores;
        });

        const newGrid = [...gridRef.current];
        newGrid[buttonIndex] = new Button("#FF0000");
        gridRef.current = newGrid;
        setGridUpdated((prev) => prev + 1);
      }
    }
  };

  useEffect(() => {
    if (pressedIndex !== null) {
      handleButtonPress(pressedIndex);
    }

    setTimeout(() => {
      resetPressedIndex();
    }, 0);
  }, [pressedIndex]);

  useEffect(() => {
    if (!isGameActive && timer === 0) {
      const highestScore = Math.max(...scores);
      const winningWallIndices = scores
        .map((score, index) => (score === highestScore ? index : -1))
        .filter((index) => index !== -1);

      playSound();
      let flashCount = 0;
      const flashInterval = setInterval(() => {
        if (flashCount >= 10) {
          clearInterval(flashInterval);
          setTimeout(() => {
            onGameEnd();
          }, 5000);
        } else {
          const newGrid = Array.from({ length: TOTAL_GRID_SIZE }, (_, index) => {
            const wallIndex = Math.floor(index / WALL_SIZE);
            if (winningWallIndices.includes(wallIndex)) {
              return new Button(flashCount % 2 === 0 ? "#00FE00" : "#000000");
            }
            return new Button("#000000");
          });
          gridRef.current = newGrid;
          setGridUpdated((prev) => prev + 1);
          flashCount++;
        }
      }, 300);
    }
  }, [isGameActive, timer, scores]);

  useEffect(() => {
    let intervalId;
    let timerId;

    if (isGameActive) {
      changeRandomSquares();
      intervalId = setInterval(changeRandomSquares, 1000);

      timerId = setInterval(() => {
        setTimer((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerId);
            clearInterval(intervalId);
            setIsGameActive(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => {
        clearInterval(intervalId);
        clearInterval(timerId);
      };
    }
  }, [isGameActive]);

  useEffect(() => {
    const autoStartTimeout = setTimeout(() => {
      setIsGameActive(true);
      setScores(Array(NUM_WALL).fill(0));
      setTimer(GAME_TIME);
    }, 500);

    return () => clearTimeout(autoStartTimeout);
  }, []);

  return (
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      textAlign: "center",
      zIndex: 10,
      }}>
      <div style={{ display: "flex", marginTop: "10vh"}}>
        <div style={{ marginRight: "15vw", justifyContent: "center", alignContent: "center"}}>
          <img
            src={whackLogo}
            alt="Game Logo"
            style={{ height: "20vh", marginBottom: "20px" }}
          />
          <h1 style={{ fontSize: "10vh" }}>
            Button Mash
          </h1>
        </div>
        <div style={{ marginLeft: "15vw", textAlign: "center", justifyContent: "center", alignContent: "center" }}>
          <div style={{ alignItems: "center", gap: "10px", justifyContent: "center", alignContent: "center", width: "10vh", marginRight: "25vh" }}>
            <span style={{ color: "#00E0FF", fontSize: "20vh", fontWeight: "bold",}}>
              0:{timer < 10 ? `0${timer}` : timer}
            </span>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: "-7vh", display: "flex", justifyContent: "space-between", width: "100vw", alignItems: "center", paddingTop:"10vh" }}>
        <div style={{ flex: "1", display: "flex", justifyContent: "center" }}>
          {activeWalls[1] && (
            <div>
              <div style={{ marginBottom: "2vh", textAlign: "center", paddingLeft: "3vw" }}>Score</div>
              <div
                style={{
                  textAlign: "center",
                  backgroundImage: `url(${left})`,
                  backgroundSize: "101%",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  backgroundPositionY: "-4px",
                  padding: "20px",
                  borderRadius: "10px",
                  height: "30vh",
                  width: "40vh"
                }}
              >
                <div
                  style={{
                    paddingLeft: "3vw",
                    marginTop: "10vh",
                    fontSize: scores[1] === Math.max(...scores) ? "20vh" : "15vh",
                    color: scores[1] === Math.max(...scores) ? "#00FF00" : "white",
                  }}
                >
                  {scores[1]}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: "1", display: "flex", justifyContent: "center" }}>
          {activeWalls[0] && (
            <div>
              <div style={{ marginBottom: "2vh", textAlign: "center" }}>Score</div>
              <div
                style={{
                  textAlign: "center",
                  backgroundImage: `url(${middle})`,
                  backgroundSize: "88%",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  backgroundPositionY: "-1px",
                  padding: "20px",
                  borderRadius: "10px",
                  height: "30vh",
                  width: "40vh"
                }}
              >
                <div
                  style={{
                    marginTop: "10vh",
                    fontSize: scores[0] === Math.max(...scores) ? "20vh" : "15vh",
                    color: scores[0] === Math.max(...scores) ? "#00FF00" : "white",
                  }}
                >
                  {scores[0]}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: "1", display: "flex", justifyContent: "center" }}>
          {activeWalls[2] && (
            <div>
              <div style={{ marginBottom: "2vh", textAlign: "center", paddingRight: "3vw" }}>Score</div>
              <div
                style={{
                  textAlign: "center",
                  backgroundImage: `url(${right})`,
                  backgroundSize: "100%",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  backgroundPositionY: "-1px",
                  padding: "20px",
                  borderRadius: "10px",
                  height: "30vh",
                  width: "40vh"
                }}
              >
                <div
                  style={{
                    marginTop: "10vh",
                    paddingRight: "3vw",
                    fontSize: scores[2] === Math.max(...scores) ? "20vh" : "15vh",
                    color: scores[2] === Math.max(...scores) ? "#00FF00" : "white",
                  }}
                >
                  {scores[2]}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game1;
