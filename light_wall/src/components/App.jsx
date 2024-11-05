import React, { useState, useEffect, useRef} from "react";
import useSound from "use-sound";
import "./App.css";
import Button from "./Button.js";
import Game1 from "./Game1.jsx";
import Game2 from "./Game2.jsx";
import tetris from "../public/tetris.png";
import whack from "../public/whack.png";
import whackLogo from "../public/button game Whack.png"
import stackLogo from "../public/stackLogo.png"
import soundEffect from "../public/press.mp3";

const CountdownScreen = ({ timeLeft, logo }) => {
  return (
    <div
      className="countdown-screen"
      style={{
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
      }}
    >
      <div style={{ display: "flex" }}>
        <div style={{ marginRight: "15vw", justifyContent: "center", alignContent: "center", marginTop: "-15vh" }}>
          <img
            src={logo}
            alt="Game Logo"
            style={{ height: "20vh", marginBottom: "20px" }}
          />
          <h1 style={{ fontSize: "10vh" }}>
            {logo === whackLogo ? "Button Mash" : "Pattern Rush"}
          </h1>
        </div>
        <div style={{ marginLeft: "15vw", textAlign: "center", justifyContent: "center", alignContent: "center" }}>
          <div style={{ alignItems: "center", gap: "10px", justifyContent: "center", alignContent: "center" }}>
            <span style={{ color: "#00E0FF", fontSize: "20vh", fontWeight: "bold" }}>
              0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
            <p style={{ color: "#FFFFFF", fontSize: "10vh" }}>game starts in</p>
          </div>
        </div>
      </div>
      <p style={{ fontSize: "10vh", lineHeight: "1em", marginBottom: "-20vh" }}>
        PRESS A BUTTON ON <br />
        YOUR WALL TO <br />
        PARTICIPATE
      </p>
    </div>
  );
};

function App() {
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("#ff0000");
  const gridRef = useRef([]);
  const [sentMessage, setSentMessage] = useState("");
  const [ws, setWs] = useState(null);
  const [highlightedSquareIndex, setHighlightedSquareIndex] = useState(null);
  const [gameLaunched, setGameLaunched] = useState(false);
  const [game2Launched, setGame2Launched] = useState(false);
  const [showGame1Screen, setShowGame1Screen] = useState(false);
  const [showGame2Screen, setShowGame2Screen] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [wsStatus, setWsStatus] = useState("Disconnected");
  const [currentPressed, setCurrentPressed] = useState(null);
  const [activeWalls, setActiveWalls] = useState([true, false, false]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastButtonPressTime, setLastButtonPressTime] = useState(0);
  const [gridUpdated, setGridUpdated] = useState(0);
  const [isStartingGame1, setIsStartingGame1] = useState(false);
  const [isStartingGame2, setIsStartingGame2] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [playSound] = useSound(soundEffect)

  const resetPressedIndex = () => {
    //setCurrentPressed(-1);
  };

 
 

  useEffect(() => {
    const totalButtons = 90;
    gridRef.current = Array.from({ length: totalButtons }, (_, index) => {
      return index === 6 || index === 8 ? new Button("#00FF00") : new Button("#000000");
    });
  }, []);

  const connectWebSocket = () => {
    const websocket = new WebSocket("ws://192.168.0.7:6432");
    setWs(websocket);

    websocket.onopen = () => {
      console.log("Connected to router at 192.168.0.7");
      setWsStatus("Connected");
      setReconnectAttempts(0);
      setGridUpdated((prev) => prev + 1);
    };

    websocket.onclose = (event) => {
      console.log(`Connection closed with code: ${event.code}, reason: ${event.reason}`);
      setWsStatus("Disconnected");

      if (event.code !== 1000) {
        handleReconnection();
      }
    };


    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsStatus("Error");
    };

    let previousByteArray = null;

    websocket.onmessage = (event) => {
      try {
        const blob = event.data;
        if (blob instanceof Blob) {
          const reader = new FileReader();

          reader.onload = () => {
            const arrayBuffer = reader.result;
            const byteArray = new Uint8Array(arrayBuffer);

            if (previousByteArray) {
              const buttonCount = byteArray.length - 2;

              for (let i = buttonCount - 1; i >= 0; i--) {
                const buttonIndex = buttonCount - i - 1;

                if (previousByteArray[i + 2] === 0x05 && byteArray[i + 2] === 0x0a) {
                  if (gridRef.current[buttonIndex]) {
                    setCurrentPressed(buttonIndex);
                    //playSound();
                  }
                }
              }
            }
            previousByteArray = byteArray;
          };
          reader.readAsArrayBuffer(blob);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };


    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.code === "KeyI") {
        setOverlayVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  };

  const handleReconnection = () => {
    const delay = Math.min(10000, 500 * 2 ** reconnectAttempts);
    setReconnectAttempts(prev => prev + 1);

    setTimeout(() => {
      console.log(`Attempting reconnection (#${reconnectAttempts})...`);
      connectWebSocket();
      setGridUpdated((prev) => prev + 1);
    }, delay);


  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);


  useEffect(() => {
    handleSendConfiguration();
  }, [gridUpdated]);

  useEffect(() => {
    const currentTime = Date.now();
    //console.log(currentPressed)
    if (!isCountdownActive) {
      if ((currentPressed === 6 && showGame1Screen && !gameLaunched && !isStartingGame1) || (currentPressed === 8 && showGame2Screen && !game2Launched && !isStartingGame2)) {
        //console.log("Returning to main screen...");
        setShowGame1Screen(false);
        setShowGame2Screen(false);
        gridRef.current[6].color = "#00FF00";
        gridRef.current[8].color = "#00FF00";
        setGridUpdated((prev) => prev + 1);
        setCurrentPressed(-1);
        playSound();
      } else if (currentPressed === 8 && showGame1Screen && !gameLaunched && !isStartingGame1 && currentTime - lastButtonPressTime >= 500) {
        //console.log("Button 8 pressed again, launching Game1...");
        startGameWithTimer(1);
        playSound();
      } else if (currentPressed === 6 && showGame2Screen && !game2Launched && !isStartingGame2 && currentTime - lastButtonPressTime >= 500) {
        //console.log("Button 6 pressed again, launching Game2...");
        startGameWithTimer(2);
        playSound();
      } else if (currentPressed === 8 && !gameLaunched && !game2Launched) {
        //console.log("Button 8 pressed, switching to Whack screen...");
        setShowGame1Screen(true);
        setShowGame2Screen(false);
        gridRef.current[8].color = "#00FF00";
        gridRef.current[6].color = "#FF0000";
        setGridUpdated((prev) => prev + 1);
        setCurrentPressed(-1);
        playSound();
      } else if (currentPressed === 6 && !game2Launched && !gameLaunched) {
        //console.log("Button 6 pressed, switching to Tetris screen...");
        setShowGame2Screen(true);
        setShowGame1Screen(false);
        gridRef.current[6].color = "#00FF00";
        gridRef.current[8].color = "#FF0000";
        setGridUpdated((prev) => prev + 1);
        setCurrentPressed(-1);
        playSound();
      } else if (!game2Launched && !gameLaunched)
      {
        playSound();
      }
    }
    setLastButtonPressTime(currentTime);
  }, [currentPressed, gameLaunched, game2Launched, showGame1Screen, showGame2Screen]);


  const startGameWithTimer = (gameNumber) => {
    setIsCountdownActive(true);

    gridRef.current.forEach((button, index) => {
      const wallIndex = Math.floor(index / 30);
      if (wallIndex === 0) {
        button.color = "#00FF00";
      } else {
        button.color = "#000000";
      }
    });

    setGridUpdated((prev) => prev + 1);

    setTimeLeft(10);
    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          clearInterval(timerInterval);

          if (gameNumber === 1) {
            setGameLaunched(true);
            setIsStartingGame1(false);
          } else if (gameNumber === 2) {
            setGame2Launched(true);
            setIsStartingGame2(false);
          }

          setIsCountdownActive(false);
          return prev;
        }
        return prev - 1;
      });
    }, 1000);

    if (gameNumber === 1) {
      setIsStartingGame1(true);
      setGameLaunched(false);
    } else if (gameNumber === 2) {
      setIsStartingGame2(true);
      setGame2Launched(false);
    }
  };

  useEffect(() => {
    if (isCountdownActive) {
      playSound();
      if (currentPressed !== null) {
        const wallIndex = Math.floor(currentPressed / 30);
        setActiveWalls((prevWalls) => {
          if (!prevWalls[wallIndex]) {
            const newWalls = [...prevWalls];
            newWalls[wallIndex] = true;

            for (let i = wallIndex * 30; i < (wallIndex + 1) * 30; i++) {
              gridRef.current[i].color = "#00FF00";
            }

            setGridUpdated((prev) => prev + 1);

            return newWalls;
          }
          return prevWalls;
        });
      }
    }
  }, [currentPressed, isCountdownActive]);



  const handleGameEnd = () => {
    //console.log("Game1 has ended.");
    gridRef.current = gridRef.current.map((button, index) => {
      return index === 6 || index === 8 ? new Button("#00FF00") : new Button("#000000");
    });
    setGridUpdated((prev) => prev + 1);
  
    setGameLaunched(false);
    setShowGame1Screen(false);
    setActiveWalls([true, false, false]);
  };
  
  const handleGame2End = () => {
    //console.log("Game2 has ended.");
    gridRef.current = gridRef.current.map((button, index) => {
      return index === 6 || index === 8 ? new Button("#00FF00") : new Button("#000000");
    });
    setGridUpdated((prev) => prev + 1);
  
    setGame2Launched(false);
    setShowGame2Screen(false);
    setActiveWalls([true, false, false]);
  };
  

  const handleSendConfiguration = () => {
    let concatenatedColors = "FFFF";
    //console.log(gridRef);
    if (!gridRef.current || gridRef.current.length === 0) {
      console.error("gridRef is empty or undefined.");
      return;
    }

    for (let i = gridRef.current.length - 1; i >= 0; i--) {
      const button = gridRef.current[i];
      const color = button?.color;

      if (!color || typeof color !== "string") {
        console.error(`Invalid color at index ${i}`);
        continue;
      }

      let r = parseInt(color.slice(1, 3), 16);
      let g = parseInt(color.slice(3, 5), 16);
      let b = parseInt(color.slice(5, 7), 16);
      r = Math.max(0, r - 1);
      g = Math.max(0, g - 1);
      b = Math.max(0, b - 1);
      const hexColor = rgbToHex(r, g, b);
      concatenatedColors += hexColor;
    }

    const finalMessage = concatenatedColors;

    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        const messageBuffer = hexStringToByteArray(finalMessage);
        ws.send(messageBuffer);
        setMessage("");
        setSentMessage("Sent message: " + finalMessage);
      } catch (error) {
        console.error("Error sending message:", error);
        setMessage("");
        setSentMessage("Error sending message");
      }
    } else {
      console.error("WebSocket is not open");
      setSentMessage("WebSocket is not open");
    }
  };

  const rgbToHex = (r, g, b) => {
    const toHex = (component) => {
      const hex = component.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const hexStringToByteArray = (hex) => {
    const byteArray = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < byteArray.length; i++) {
      byteArray[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return byteArray;
  };

  const handleColorChange = (event) => {
    setColor(event.target.value);
  };

  const commonContainerStyle = {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: "50px",
    width: "80vw",
    marginTop: "320px",
    height: "80vh",
    minHeight: "80vh",
    marginBottom: "350px",
    paddingBottom: "20px",
  };

  return (
    <div
      className="container-all"
      style={{
        //backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >

      {isStartingGame1 && !gameLaunched && <CountdownScreen timeLeft={timeLeft} logo={whackLogo} />}
      {isStartingGame2 && !game2Launched && <CountdownScreen timeLeft={timeLeft} logo={stackLogo} />}

      {!showGame1Screen && !showGame2Screen && (
        <>
          {/*Main Screen*/}
          <div style={{ display: "flex", height: "80vh", width: "100%", alignItems: "center", justifyContent: "center" }}>
            <div className="gamecontainer" style={{ marginRight: "5vw" }}>
              <img
                src={whackLogo}
                alt="Whack Image"
                style={{
                  height: "15vh",
                  objectFit: "contain",
                  marginTop: "10px"
                }}
              />
              <h1>Button Mash</h1>
              <img
                src={whack}
                alt="Whack Image"
                style={{
                  maxWidth: "25vh",
                  maxHeight: "50vh",
                  objectFit: "contain",
                  marginBottom: "10px",
                }}
              />
              <div style={{ textAlign: "center", marginTop: "5vh" }}>
                <div className="circle" style={{ backgroundColor: "#00FF00" }}
                  onClick={() => setCurrentPressed(8)}
                />
                <p style={{ fontSize: "5vh" }}>Press to Start</p>
              </div>
            </div>

            <div className="gamecontainer" style={{ marginLeft: "5vw" }}>
              <img
                src={stackLogo}
                alt="Whack Image"
                style={{
                  marginTop: "10px",
                  height: "15vh",
                  objectFit: "contain",
                }}
              />
              <h1>Pattern Rush</h1>
              <img
                src={tetris}
                alt="Tetris Image"
                style={{
                  maxWidth: "25vh",
                  maxHeight: "50vh",
                  objectFit: "contain",
                  marginBottom: "10px",
                }}
              />
              <div style={{ textAlign: "center", marginTop: "5vh" }}>
                <div className="circle" style={{ backgroundColor: "#00FF00" }}
                  onClick={() => setCurrentPressed(6)}
                />
                <p style={{ fontSize: "5vh" }}>Press to Start</p>
              </div>
            </div>
          </div>

        </>
      )}

      {showGame1Screen && (
        <div className="game-screen">
          {!gameLaunched && !isCountdownActive && (
            <div style={{ display: "flex", marginTop: "5vh" }}>
              <div style={{ alignItems: "center", textAlign: "center" }}>
                <img
                  src={whackLogo}
                  alt="Whack Image"
                  style={{
                    marginTop: "10px",
                    maxWidth: "10vw",
                    objectFit: "contain",
                    marginBottom: "5px",
                  }}
                />
                <h1 style={{ textAlign: "center", marginBottom: "15vh" }}>Button Mash</h1>
              </div>
              <div style={{ textAlign: "center", marginLeft: "7vw", fontSize: "7vh" }}>
                <p style={{ textAlign: "center" }}>
                  Compete to score by hitting <span style={{ color: "#00FF00" }}>green</span>
                </p>
                <p style={{ textAlign: "center" }}>
                  buttons and avoiding <span style={{ color: "red" }}>red</span>.
                </p>
                <p style={{ textAlign: "center", paddingBottom: "10%" }}>
                  Highest points when time’s up wins!
                </p>
              </div>
            </div>
          )}

          {/* Display Game1 if launched */}
          {gameLaunched && (
            <div style={{ marginTop: "30vh" }}>
              <Game1
                gridRef={gridRef}
                setGridUpdated={setGridUpdated}
                pressedIndex={currentPressed}
                resetPressedIndex={resetPressedIndex}
                onGameEnd={handleGameEnd}
                activeWalls={activeWalls}
              />
            </div>
          )}

          {/* Green and Red Circles at the Bottom for Whack Screen */}
          {!gameLaunched && !isStartingGame1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                bottom: "10px",
                width: "100%",
                marginTop: "15vh"
              }}
            >
              <div style={{ textAlign: "center", marginRight: "300px" }}>
                <div className="circle" style={{ backgroundColor: "#00FF00" }}
                  onClick={() => setCurrentPressed(8)}
                />
                <p style={{ marginBottom: "0px", fontSize: "10vh" }}>Press to Play</p>
              </div>

              <div style={{ textAlign: "center", marginLeft: "300px" }}>
                <div className="circle" style={{ backgroundColor: "#FF0000" }}
                  onClick={() => setCurrentPressed(6)}
                />
                <p style={{ marginBottom: "0px", fontSize: "10vh" }}>Press to go Back</p>
              </div>
            </div>
          )}
        </div>
      )}

      {showGame2Screen && (
        <div className="game-screen">
          {!game2Launched && !isCountdownActive && (
            <div style={{ display: "flex", marginTop: "5vh" }}>
              <div style={{ alignItems: "center", textAlign: "center" }}>
                <img
                  src={stackLogo}
                  alt="Whack Image"
                  style={{
                    marginTop: "10px",
                    maxWidth: "10vw",
                    objectFit: "contain",
                    marginBottom: "5px",
                  }}
                />
                <h1 style={{ textAlign: "center", marginBottom: "15vh" }}>Pattern Rush</h1>
              </div>
              <div style={{ textAlign: "center", marginLeft: "7vw", fontSize: "7vh" }}>
                <p style={{ textAlign: "center" }}>
                  Compete to match the shape on screen
                </p>
                <p style={{ textAlign: "center" }}>
                  by hitting the correct button.
                </p>
                <p style={{ textAlign: "center", paddingBottom: "10%" }}>
                  HIGHEST points when time’s up wins!
                </p>
              </div>
            </div>
          )}

          {/* Display Game2 if launched */}
          {game2Launched && (
            <div style={{ marginTop: "10vh" }}>
              <Game2
                gridRef={gridRef}
                setGridUpdated={setGridUpdated}
                onGameEnd={handleGame2End}
                pressedIndex={currentPressed}
                resetPressedIndex={resetPressedIndex}
                activeWalls={activeWalls}
              />
            </div>
          )}

          {/* Green and Red Circles at the Bottom for Tetris Screen */}
          {!game2Launched && !isStartingGame2 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                bottom: "10px",
                width: "100%",
                marginTop: "15vh"
              }}
            >
              <div style={{ textAlign: "center", marginRight: "300px" }}>
                <div className="circle" style={{ backgroundColor: "#FF0000" }}
                  onClick={() => setCurrentPressed(8)}
                />
                <p style={{ marginBottom: "0px", fontSize: "10vh" }}>Press to go Back</p>
              </div>

              <div style={{ textAlign: "center", marginLeft: "300px" }}>
                <div className="circle" style={{ backgroundColor: "#00FF00" }}
                  onClick={() => setCurrentPressed(6)}
                />
                <p style={{ marginBottom: "0px", fontSize: "10vh" }}>Press to Play</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
