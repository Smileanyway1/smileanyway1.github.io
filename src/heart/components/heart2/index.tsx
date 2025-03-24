import React, { useEffect, useRef } from "react";

interface Settings {
  particles: {
    length: number;
    duration: number;
    velocity: number;
    effect: number;
    size: number;
  };
}

class Point {
  x: number;
  y: number;

  constructor(x?: number, y?: number) {
    this.x = typeof x !== "undefined" ? x : 0;
    this.y = typeof y !== "undefined" ? y : 0;
  }

  clone(): Point {
    return new Point(this.x, this.y);
  }

  length(length?: number): number | Point {
    if (typeof length === "undefined") {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    this.normalize();
    this.x *= length;
    this.y *= length;
    return this;
  }

  normalize(): Point {
    const length = this.length() as number;
    this.x /= length;
    this.y /= length;
    return this;
  }
}

class Particle {
  position: Point;
  velocity: Point;
  acceleration: Point;
  age: number;

  constructor() {
    this.position = new Point();
    this.velocity = new Point();
    this.acceleration = new Point();
    this.age = 0;
  }

  initialize(
    x: number,
    y: number,
    dx: number,
    dy: number,
    settings: Settings
  ): void {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = dx;
    this.velocity.y = dy;
    this.acceleration.x = dx * settings.particles.effect;
    this.acceleration.y = dy * settings.particles.effect;
    this.age = 0;
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.age += deltaTime;
  }

  draw(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    settings: Settings
  ): void {
    function ease(t: number): number {
      return --t * t * t + 1;
    }
    const size = image.width * ease(this.age / settings.particles.duration);
    context.globalAlpha = 1 - this.age / settings.particles.duration;
    context.drawImage(
      image,
      this.position.x - size / 2,
      this.position.y - size / 2,
      size,
      size
    );
  }
}

class ParticlePool {
  particles: Particle[];
  firstActive: number;
  firstFree: number;
  duration: number;

  constructor(length: number, settings: Settings) {
    this.particles = new Array(length);
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i] = new Particle();
    }
    this.firstActive = 0;
    this.firstFree = 0;
    this.duration = settings.particles.duration;
  }

  add(x: number, y: number, dx: number, dy: number, settings: Settings): void {
    this.particles[this.firstFree].initialize(x, y, dx, dy, settings);
    this.firstFree++;
    if (this.firstFree === this.particles.length) {
      this.firstFree = 0;
    }
    if (this.firstActive === this.firstFree) {
      this.firstActive++;
    }
    if (this.firstActive === this.particles.length) {
      this.firstActive = 0;
    }
  }

  update(deltaTime: number): void {
    let i: number;

    if (this.firstActive < this.firstFree) {
      for (i = this.firstActive; i < this.firstFree; i++) {
        this.particles[i].update(deltaTime);
      }
    }
    if (this.firstFree < this.firstActive) {
      for (i = this.firstActive; i < this.particles.length; i++) {
        this.particles[i].update(deltaTime);
      }
      for (i = 0; i < this.firstFree; i++) {
        this.particles[i].update(deltaTime);
      }
    }

    while (
      this.particles[this.firstActive].age >= this.duration &&
      this.firstActive !== this.firstFree
    ) {
      this.firstActive++;
      if (this.firstActive === this.particles.length) {
        this.firstActive = 0;
      }
    }
  }

  draw(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    settings: Settings
  ): void {
    let i: number;

    if (this.firstActive < this.firstFree) {
      for (i = this.firstActive; i < this.firstFree; i++) {
        this.particles[i].draw(context, image, settings);
      }
    }
    if (this.firstFree < this.firstActive) {
      for (i = this.firstActive; i < this.particles.length; i++) {
        this.particles[i].draw(context, image, settings);
      }
      for (i = 0; i < this.firstFree; i++) {
        this.particles[i].draw(context, image, settings);
      }
    }
  }
}

const HeartAnimation2: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const settings: Settings = {
      particles: {
        length: 2000,
        duration: 2,
        velocity: 100,
        effect: -1.3,
        size: 13,
      },
    };

    const pointOnHeart = (t: number): Point => {
      return new Point(
        160 * Math.pow(Math.sin(t), 3),
        130 * Math.cos(t) -
          50 * Math.cos(2 * t) -
          20 * Math.cos(3 * t) -
          10 * Math.cos(4 * t) +
          25
      );
    };

    const createImage = (): HTMLImageElement => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not get context");

      canvas.width = settings.particles.size;
      canvas.height = settings.particles.size;

      const to = (t: number): Point => {
        const point = pointOnHeart(t);
        point.x =
          settings.particles.size / 2 +
          (point.x * settings.particles.size) / 350;
        point.y =
          settings.particles.size / 2 -
          (point.y * settings.particles.size) / 350;
        return point;
      };

      context.beginPath();
      let t = -Math.PI;
      let point = to(t);
      context.moveTo(point.x, point.y);
      while (t < Math.PI) {
        t += 0.01;
        point = to(t);
        context.lineTo(point.x, point.y);
      }
      context.closePath();
      context.fillStyle = "#FF5CA4";
      context.fill();

      const image = new Image();
      image.src = canvas.toDataURL();
      return image;
    };

    const image = createImage();
    const particles = new ParticlePool(settings.particles.length, settings);
    let time: number;

    const render = () => {
      requestAnimationFrame(render);

      const newTime = new Date().getTime() / 1000;
      const deltaTime = newTime - (time || newTime);
      time = newTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const amount =
        (settings.particles.length / settings.particles.duration) * deltaTime;
      for (let i = 0; i < amount; i++) {
        const pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
        const dir = pos.clone().length(settings.particles.velocity) as Point;
        particles.add(
          canvas.width / 2 + pos.x,
          canvas.height / 2 - pos.y,
          dir.x,
          -dir.y,
          settings
        );
      }

      particles.update(deltaTime);
      particles.draw(ctx, image, settings);
    };

    const onResize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };

    window.addEventListener("resize", onResize);
    setTimeout(() => {
      onResize();
      render();
    }, 10);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="box">
      <canvas ref={canvasRef} id="pinkboard" />
      <div
        className="center-text"
        style={{
          backgroundColor: "rgb(0, 0, 0)",
          width: "100%",
          color: "rgb(225, 12, 168)",
          height: "100%",
          fontSize: "31px",
          fontStyle: "italic",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "5px",
          textAlign: "center",
        }}
      >
        I Love You
      </div>
    </div>
  );
};

export default HeartAnimation2;
