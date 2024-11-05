import React, { useState, useEffect, useRef } from "react";
import Button from "./Button";
import left from "../public/left.png";
import middle from "../public/middle.png";
import right from "../public/right.png";
import gameEnd from "../public/game_end.mp3";
import useSound from "use-sound";
import roundEnd from "../public/pattern_round.mp3";

const availableColors = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "pink",
  "cyan",
  "orange",
  "lightgreen",
];

const colorMap = {
  red: "#FF0000",
  blue: "#0000FF",
  green: "#00FF00",
  yellow: "#FFFF00",
  purple: "#d5006d",
  pink: "#ff79c4",
  cyan: "#00FFFF",
  orange: "#ff7c00",
  lightgreen: "#38fc69",
};

const screenColorMap = {
  red: "#FF0000",
  blue: "#0000FF",
  green: "#00FF00",
  yellow: "#FFFF00",
  purple: "#d5006d",
  pink: "#ff79c4",
  cyan: "#00d9ff",
  orange: "#ff7c00",
  lightgreen: "#73ff8a",
};

const generateRandomShape = (remainingSpaces, availableColors, rows, columns) => {
  if (availableColors.length === 0) {
    console.error("No available colors left to assign.");
    return null;
  }

  const colorName = availableColors.pop();
  if (!colorMap[colorName]) {
    console.error(`Color ${colorName} is not in colorMap.`);
    return null;
  }

  const colorHex = colorMap[colorName];
  const shape = [];

  const startIndex = Math.floor(Math.random() * remainingSpaces.length);
  const start = remainingSpaces[startIndex];
  shape.push(start);

  remainingSpaces.splice(startIndex, 1);

  let minRow = start.row;
  let maxRow = start.row;

  while (shape.length < Math.min(3, remainingSpaces.length) && remainingSpaces.length > 0) {
    const lastNode = shape[shape.length - 1];
    const potentialPositions = [
      { row: lastNode.row - 1, col: lastNode.col },
      { row: lastNode.row + 1, col: lastNode.col },
      { row: lastNode.row, col: lastNode.col - 1 },
      { row: lastNode.row, col: lastNode.col + 1 },
    ];

    const validPositions = potentialPositions.filter((pos) =>
      pos.row >= 0 &&
      pos.row < rows &&
      pos.col >= 0 &&
      pos.col < columns &&
      remainingSpaces.some((space) => space.row === pos.row && space.col === pos.col) &&
      Math.abs(Math.max(maxRow, pos.row) - Math.min(minRow, pos.row)) < 4
    );

    if (validPositions.length > 0) {
      const nextPosition = validPositions[Math.floor(Math.random() * validPositions.length)];
      shape.push(nextPosition);

      minRow = Math.min(minRow, nextPosition.row);
      maxRow = Math.max(maxRow, nextPosition.row);

      const indexToRemove = remainingSpaces.findIndex(
        (space) => space.row === nextPosition.row && space.col === nextPosition.col
      );
      remainingSpaces.splice(indexToRemove, 1);
    } else {
      break;
    }
  }

  return { color: colorHex, colorName, nodes: shape };
};

function Game2({ gridRef, setGridUpdated, onGameEnd, pressedIndex, resetPressedIndex, activeWalls }) {
  const WALL_COUNT = 3;
  const GRID_WIDTH = 5;
  const GRID_HEIGHT = 6;
  const TOTAL_ROUNDS = 10;
  const INACTIVE_TIMEOUT = 20000;

  const [generatedShapes, setGeneratedShapes] = useState([]);
  const [rounds, setRounds] = useState(0);
  const selectedShape = useRef(null);
  const [scores, setScores] = useState(Array(WALL_COUNT).fill(0));
  const inactivityTimeout = useRef(null);
  const [roundScored, setRoundScored] = useState(false);
  const [winner, setWinner] = useState(null);

  const [playSound] = useSound(gameEnd);
  const [playRoundEnd] = useSound(roundEnd);

  const adjustForButtonConnections = (index, gridWidth) => {
    const row = Math.floor(index / gridWidth);
    if (row % 2 === 1) {
      const col = index % gridWidth;
      return row * gridWidth + (gridWidth - 1 - col);
    }
    return index;
  };

  const startInactivityTimeout = () => {
    if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
    inactivityTimeout.current = setTimeout(() => {
      console.log("No button pressed within 1 minute. Ending game.");
      resetGridToDefault();
      onGameEnd();
    }, INACTIVE_TIMEOUT);
  };

const flashWinner = () => {
    if (rounds >= TOTAL_ROUNDS) {
      const maxScore = Math.max(...scores);
      const winningWallIndex = scores.indexOf(maxScore);
      setWinner(winningWallIndex);
      console.log(`Winner: Wall ${winningWallIndex}`);

      let blinkCount = 0;
      const blinkInterval = setInterval(() => {
        if (blinkCount >= 10) {
          clearInterval(blinkInterval);
          return;
        }

        gridRef.current.forEach((button, index) => {
          const wallIndex = Math.floor(index / (GRID_WIDTH * GRID_HEIGHT));
          const adjustedIndex = adjustForButtonConnections(index, GRID_WIDTH);
          if (wallIndex === winningWallIndex) {
            button.setColor(blinkCount % 2 === 0 ? "#00FF00" : "#000000");
          } else {
            button.setColor("#000000");
          }
        });

        setGridUpdated((prev) => prev + 1);
        blinkCount++;
      }, 300);
    }
  }

  const generateShapes = () => {
    if (rounds >= TOTAL_ROUNDS) {
      //gridRef.current.forEach((button) => button.setColor("#000000"));
      //setGridUpdated((prev) => prev + 1);
      playSound();
      flashWinner();
      setTimeout(() => {
        clearTimeout(inactivityTimeout.current);
        resetGridToDefault();
        onGameEnd();
      }, 10000);
      return;
    }

    setRoundScored(false);

    gridRef.current = Array(WALL_COUNT * GRID_WIDTH * GRID_HEIGHT).fill(null).map(() => new Button("#000000"));
    setGridUpdated((prev) => prev + 1);

    const newShapes = [];
    let remainingSpaces = [];
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        remainingSpaces.push({ row, col });
      }
    }

    let colorsCopy = [...availableColors];

    while (remainingSpaces.length > 0 && colorsCopy.length > 0) {
      const newShape = generateRandomShape(remainingSpaces, colorsCopy, GRID_HEIGHT, GRID_WIDTH);
      if (newShape) {
        newShapes.push(newShape);
        newShape.nodes.forEach((node) => {
          const buttonIndex = node.row * GRID_WIDTH + node.col;
          const adjustedIndex = adjustForButtonConnections(buttonIndex, GRID_WIDTH);
          gridRef.current[adjustedIndex].setColor(colorMap[newShape.colorName]);
        });
      }
    }

    const commonShape = newShapes[Math.floor(Math.random() * newShapes.length)];
    if (!commonShape || !commonShape.colorName) {
      console.error("Selected common shape or its colorName is invalid.");
      return;
    }

    selectedShape.current = {
      color: commonShape.color,
      colorName: commonShape.colorName,
      nodes: commonShape.nodes.map((node) => ({ ...node, gridIndex: 0 })),
    };
    logSelectedCommonShape(commonShape);

    gridRef.current.forEach((button, index) => {
      const wallIndex = Math.floor(index / (GRID_WIDTH * GRID_HEIGHT));
      if (button.color === "#000000" && activeWalls[wallIndex]) {
        const randomColorName = availableColors[Math.floor(Math.random() * availableColors.length)];
        button.setColor(colorMap[randomColorName]);
      }
    });

    for (let wallIndex = 1; wallIndex < WALL_COUNT; wallIndex++) {
      if (!activeWalls[wallIndex]) continue;

      const remainingSpacesForGrid = [];
      for (let row = 0; row < GRID_HEIGHT; row++) {
        for (let col = 0; col < GRID_WIDTH; col++) {
          remainingSpacesForGrid.push({ row, col });
        }
      }

      let colorsCopyForGrid = [...availableColors].filter((color) => colorMap[color] !== commonShape.color);

      while (remainingSpacesForGrid.length > 0 && colorsCopyForGrid.length > 0) {
        const newShapeForGrid = generateRandomShape(remainingSpacesForGrid, colorsCopyForGrid, GRID_HEIGHT, GRID_WIDTH);
        if (newShapeForGrid) {
          newShapeForGrid.nodes.forEach((node) => {
            const buttonIndex = node.row * GRID_WIDTH + node.col + wallIndex * GRID_WIDTH * GRID_HEIGHT;
            const adjustedIndex = adjustForButtonConnections(buttonIndex, GRID_WIDTH);
            gridRef.current[adjustedIndex].setColor(newShapeForGrid.color);
          });
        }
      }

      const maxRowOffset = GRID_HEIGHT - Math.max(...commonShape.nodes.map((node) => node.row)) - 1;
      const maxColOffset = GRID_WIDTH - Math.max(...commonShape.nodes.map((node) => node.col)) - 1;

      const rowOffset = Math.floor(Math.random() * (maxRowOffset + 1));
      const colOffset = Math.floor(Math.random() * (maxColOffset + 1));

      const newNodesForThisWall = [];
      commonShape.nodes.forEach((node) => {
        const newRow = node.row + rowOffset;
        const newCol = node.col + colOffset;
        const buttonIndex = newRow * GRID_WIDTH + newCol + wallIndex * GRID_WIDTH * GRID_HEIGHT;
        const adjustedIndex = adjustForButtonConnections(buttonIndex, GRID_WIDTH);
        gridRef.current[adjustedIndex].setColor(commonShape.color);

        newNodesForThisWall.push({ row: newRow, col: newCol, gridIndex: wallIndex });
      });

      selectedShape.current.nodes = [...selectedShape.current.nodes, ...newNodesForThisWall];
    }

    setGeneratedShapes(newShapes);
    setGridUpdated((prev) => prev + 1);
    setRounds((prevRounds) => prevRounds + 1);
    startInactivityTimeout();
  };

  const logSelectedCommonShape = (commonShape) => {
    console.log("Selected Common Shape:");
    commonShape.nodes.forEach(node => {
      console.log(`Grid: 0, Row: ${node.row}, Col: ${node.col}`);
    });

    selectedShape.current.nodes.forEach(node => {
      console.log(`Grid: ${node.gridIndex}, Row: ${node.row}, Col: ${node.col}`);
    });
  };

  const resetGridToDefault = () => {
    gridRef.current = Array.from({ length: WALL_COUNT * GRID_WIDTH * GRID_HEIGHT }, (_, index) => {
      const adjustedIndex = adjustForButtonConnections(index, GRID_WIDTH);
      if (adjustedIndex === 6 || adjustedIndex === 8) return new Button("#00FF00");
      return new Button("#000000");
    });

    setGridUpdated((prev) => prev + 1);
    setRounds(0);
  };

  const handleButtonPress = (buttonIndex) => {
    if (inactivityTimeout.current) {
      clearTimeout(inactivityTimeout.current);
    }
    startInactivityTimeout();

    const gridIndex = Math.floor(buttonIndex / (GRID_WIDTH * GRID_HEIGHT));
    const indexInGrid = buttonIndex % (GRID_WIDTH * GRID_HEIGHT);
    const row = Math.floor(indexInGrid / GRID_WIDTH);
    let col = indexInGrid % GRID_WIDTH;

    if (row % 2 === 1) {
      col = GRID_WIDTH - 1 - col;
    }

    console.log(`Button pressed: (${row}, ${col}) in Grid ${gridIndex}`);

    if (selectedShape.current && !roundScored) {
      const isMatch = selectedShape.current.nodes.some(
        (node) =>
          node.gridIndex === gridIndex &&
          node.row === row &&
          node.col === col
      );

      if (isMatch) {
        playRoundEnd();
        console.log("Match found with selected shape!");
        setScores((prevScores) => {
          const newScores = [...prevScores];
          newScores[gridIndex] += 1;
          return newScores;
        });
        setRoundScored(true);

        const tempGridRef = [...gridRef.current];
        for (let wall = 0; wall < WALL_COUNT; wall++) {
          if (!activeWalls[wall]) continue;

          for (let row = 0; row < GRID_HEIGHT; row++) {
            for (let col = 0; col < GRID_WIDTH; col++) {
              const buttonIndex = row * GRID_WIDTH + col + wall * GRID_WIDTH * GRID_HEIGHT;
              const adjustedIndex = adjustForButtonConnections(buttonIndex, GRID_WIDTH);
              tempGridRef[adjustedIndex].setColor(wall === gridIndex ? "#00FF00" : "#FF0000");
            }
          }
        }
        setGridUpdated((prev) => prev + 1);

        setTimeout(() => {
          generateShapes();
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (pressedIndex !== null) {
      console.log("Pressed button index:", pressedIndex);
      handleButtonPress(pressedIndex);
    }

    setTimeout(() => {
      resetPressedIndex();
    }, 0);
  }, [pressedIndex]);

  useEffect(() => {
    generateShapes();
  }, []);

  let minRow = 0,
    maxRow = 0,
    minCol = 0,
    maxCol = 0,
    shapeRowSpan = 1,
    shapeColSpan = 1;

  if (selectedShape.current && selectedShape.current.nodes) {
    const grid0Nodes = selectedShape.current.nodes.filter((node) => node.gridIndex === 0);

    minRow = Math.min(...grid0Nodes.map((node) => node.row));
    maxRow = Math.max(...grid0Nodes.map((node) => node.row));
    minCol = Math.min(...grid0Nodes.map((node) => node.col));
    maxCol = Math.max(...grid0Nodes.map((node) => node.col));

    shapeRowSpan = maxRow - minRow + 1;
    shapeColSpan = maxCol - minCol + 1;
  }

  return (
    <div style={{ textAlign: "center", padding: "10px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          height: "69vh",
          marginBottom: "-15px",
          marginTop: "-15vh"
        }}
      >
        <div
          style={{
            width: "65vh",
            height: "65vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            borderRadius: "10px",
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              display: "grid",
              gridGap: "5px",
              gridTemplateColumns: `repeat(${shapeColSpan}, 13vh)`,
              gridTemplateRows: `repeat(${shapeRowSpan}, 13vh)`,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {Array.from({ length: shapeRowSpan * shapeColSpan }).map((_, index) => {
              const row = Math.floor(index / shapeColSpan) + minRow;
              const col = (index % shapeColSpan) + minCol;
              const isShapeNode = selectedShape.current?.nodes.some(
                (node) => node.row === row && node.col === col && node.gridIndex === 0
              );

              const colorName = selectedShape.current?.colorName;
              const displayColor = colorName && screenColorMap[colorName] ? screenColorMap[colorName] : "transparent";
              console.log(colorName);

              return (
                <div
                  key={index}
                  style={{
                    width: "13vh",
                    height: "13vh",
                    backgroundColor: isShapeNode ? displayColor : "transparent",
                    border: isShapeNode ? "1px solid black" : "none",
                    borderRadius: "50%",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ paddingBottom: "15vh", display: "flex", justifyContent: "space-between", width: "100vw", alignItems: "center" }}>
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
}

export default Game2;
