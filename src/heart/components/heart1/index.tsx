import React, { useEffect, useRef, useState } from "react";
import HeartAnimation3 from "../heart3";

// Styles
const styles = {
  container: {
    margin: 0,
    background: "black",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    flexDirection: "column" as const,
    position: "relative" as const,
  },
  canvas: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  message: {
    color: "pink",
    fontSize: "2.5rem",
    fontWeight: "bold",
    textAlign: "center" as const,
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "600px",
    height: "300px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
    transition: "opacity 2s ease-in-out",
    zIndex: 2,
  },
  heart: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) scale(5)",
    width: "150px",
    height: "150px",
    backgroundColor: "rgba(255, 20, 147, 0.8)",
    clipPath:
      "path('M 75,30 A 30,30 0 1,1 45,0 A 30,30 0 1,1 15,30 Q 0,60 75,135 Q 150,60 135,30 A 30,30 0 1,1 105,0 A 30,30 0 1,1 75,30 Z')",
    animation: "blink 1s infinite alternate",
    transition: "transform 2s ease-in-out, opacity 1.5s ease-in-out",
  },
  button: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "pink",
    color: "black",
    fontSize: "1.5rem",
    padding: "10px 20px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    zIndex: 3,
  },
};

const HeartAnimation1: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [melting, setMelting] = useState(false);
  const [showHeart, setShowHeart] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const flowersRef = useRef<
    Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
    }>
  >([]);

  const createFlowerParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    for (let i = 0; i < 50; i++) {
      flowersRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 6 + 2,
        color: ["pink", "red", "yellow", "white"][
          Math.floor(Math.random() * 4)
        ],
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: Math.random() * -0.5 - 0.2,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const drawFlowers = (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement
    ) => {
      for (let i = 0; i < flowersRef.current.length; i++) {
        let f = flowersRef.current[i];
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        f.x += f.speedX;
        f.y += f.speedY;
        if (f.y < -10) {
          f.y = canvas.height + 10;
          f.x = Math.random() * canvas.width;
        }
      }
    };

    const animate = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (melting) drawFlowers(ctx, canvas);
      requestAnimationFrame(animate);
    };

    animate();
  }, [melting]);

  const handleClick = () => {
    setShowButton(false);

    setShowHeart(false);
    setTimeout(() => {
      setShowMessage(true);
      setMelting(true);
      createFlowerParticles();
    }, 100);
  };

  return (
    <div>
      <HeartAnimation3 />
      <canvas ref={canvasRef} style={styles.canvas} />
      {showHeart && (
        <div
          style={{
            // ...styles.heart,
            opacity: showHeart ? 1 : 0,
            transform: showHeart
              ? "translate(-50%, -50%) scale(5)"
              : "translate(-50%, -50%) scale(0)",
          }}
        />
      )}
      <div
        style={{
          ...styles.message,
          opacity: showMessage ? 1 : 0,
        }}
      >
        💖 Chúc mừng Ngày Quốc tế Phụ nữ 8/3! 💐
        <br />
        Chúc em yêu luôn hạnh phúc, xinh đẹp và tràn đầy yêu thương! 🌸💖
      </div>
      {showButton && (
        <button style={styles.button} onClick={handleClick}>
          Open your gift
        </button>
      )}
    </div>
  );
};

export default HeartAnimation1;
