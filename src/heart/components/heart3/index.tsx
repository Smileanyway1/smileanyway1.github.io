import React, { useEffect, useRef } from "react";
import "./styles.css";

interface Point {
  x: number;
  y: number;
  clone(): Point;
  length(length?: number): number | Point;
  normalize(): Point;
}

interface Particle {
  position: Point;
  velocity: Point;
  acceleration: Point;
  age: number;
  initialize(x: number, y: number, dx: number, dy: number): void;
  update(deltaTime: number): void;
  draw(context: CanvasRenderingContext2D, image: HTMLImageElement): void;
}

interface ParticlePool {
  add(x: number, y: number, dx: number, dy: number): void;
  update(deltaTime: number): void;
  draw(context: CanvasRenderingContext2D, image: HTMLImageElement): void;
}

interface Settings {
  particles: {
    length: number;
    duration: number;
    velocity: number;
    effect: number;
    size: number;
  };
}

// Extend Window interface to include requestAnimationFrame and cancelAnimationFrame
declare global {
  interface Window {
    [key: string]: any;
  }
}

const HeartAnimation3: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    // Using non-null assertion operator since we've already checked canvasRef.current
    const context = canvas.getContext("2d")!;
    if (!context) return;

    const settings: Settings = {
      particles: {
        length: 2000, // maximum amount of particles
        duration: 2, // particle duration in sec
        velocity: 100, // particle velocity in pixels/sec
        effect: -1.3, // play with this for a nice effect
        size: 13, // particle size in pixels
      },
    };

    // RequestAnimationFrame polyfill
    (function () {
      let lastTime = 0;
      const vendors = ["ms", "moz", "webkit", "o"];
      for (
        let x = 0;
        x < vendors.length && !window.requestAnimationFrame;
        ++x
      ) {
        window.requestAnimationFrame =
          window[vendors[x] + "RequestAnimationFrame"];
        window.cancelAnimationFrame =
          window[vendors[x] + "CancelAnimationFrame"] ||
          window[vendors[x] + "CancelRequestAnimationFrame"];
      }

      if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback) {
          const currTime = new Date().getTime();
          const timeToCall = Math.max(0, 16 - (currTime - lastTime));
          const id = window.setTimeout(function () {
            callback(currTime + timeToCall);
          }, timeToCall);
          lastTime = currTime + timeToCall;
          return id;
        };
      }

      if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
          clearTimeout(id);
        };
      }
    })();

    // Point class
    class PointClass implements Point {
      x: number;
      y: number;

      constructor(x?: number, y?: number) {
        this.x = typeof x !== "undefined" ? x : 0;
        this.y = typeof y !== "undefined" ? y : 0;
      }

      clone(): Point {
        return new PointClass(this.x, this.y);
      }

      length(length?: number): number | Point {
        if (typeof length === "undefined")
          return Math.sqrt(this.x * this.x + this.y * this.y);
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

    // Particle class
    class ParticleClass implements Particle {
      position: Point;
      velocity: Point;
      acceleration: Point;
      age: number;

      constructor() {
        this.position = new PointClass();
        this.velocity = new PointClass();
        this.acceleration = new PointClass();
        this.age = 0;
      }

      initialize(x: number, y: number, dx: number, dy: number): void {
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

      draw(context: CanvasRenderingContext2D, image: HTMLImageElement): void {
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

    // ParticlePool class
    class ParticlePoolClass implements ParticlePool {
      particles: Particle[];
      firstActive: number = 0;
      firstFree: number = 0;
      duration: number = settings.particles.duration;

      constructor(length: number) {
        // create and populate particle pool
        this.particles = new Array(length);
        for (let i = 0; i < this.particles.length; i++)
          this.particles[i] = new ParticleClass();
      }

      add(x: number, y: number, dx: number, dy: number): void {
        this.particles[this.firstFree].initialize(x, y, dx, dy);
        // handle circular queue
        this.firstFree++;
        if (this.firstFree === this.particles.length) this.firstFree = 0;
        if (this.firstActive === this.firstFree) this.firstActive++;
        if (this.firstActive === this.particles.length) this.firstActive = 0;
      }

      update(deltaTime: number): void {
        let i: number;
        // update active particles
        if (this.firstActive < this.firstFree) {
          for (i = this.firstActive; i < this.firstFree; i++)
            this.particles[i].update(deltaTime);
        }
        if (this.firstFree < this.firstActive) {
          for (i = this.firstActive; i < this.particles.length; i++)
            this.particles[i].update(deltaTime);
          for (i = 0; i < this.firstFree; i++)
            this.particles[i].update(deltaTime);
        }
        // remove inactive particles
        while (
          this.particles[this.firstActive].age >= this.duration &&
          this.firstActive !== this.firstFree
        ) {
          this.firstActive++;
          if (this.firstActive === this.particles.length) this.firstActive = 0;
        }
      }

      draw(context: CanvasRenderingContext2D, image: HTMLImageElement): void {
        let i: number;
        // draw active particles
        if (this.firstActive < this.firstFree) {
          for (i = this.firstActive; i < this.firstFree; i++)
            this.particles[i].draw(context, image);
        }
        if (this.firstFree < this.firstActive) {
          for (i = this.firstActive; i < this.particles.length; i++)
            this.particles[i].draw(context, image);
          for (i = 0; i < this.firstFree; i++)
            this.particles[i].draw(context, image);
        }
      }
    }

    const particles = new ParticlePoolClass(settings.particles.length);
    const particleRate =
      settings.particles.length / settings.particles.duration; // particles/sec
    let time: number;

    // get point on heart with -PI <= t <= PI
    function pointOnHeart(t: number): Point {
      return new PointClass(
        160 * Math.pow(Math.sin(t), 3),
        130 * Math.cos(t) -
          50 * Math.cos(2 * t) -
          20 * Math.cos(3 * t) -
          10 * Math.cos(4 * t) +
          25
      );
    }

    // creating the particle image using a dummy canvas
    const image = (function (): HTMLImageElement {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not get canvas context");

      canvas.width = settings.particles.size;
      canvas.height = settings.particles.size;

      // helper function to create the path
      function to(t: number): Point {
        const point = pointOnHeart(t);
        point.x =
          settings.particles.size / 2 +
          (point.x * settings.particles.size) / 350;
        point.y =
          settings.particles.size / 2 -
          (point.y * settings.particles.size) / 350;
        return point;
      }

      // create the path
      context.beginPath();
      let t = -Math.PI;
      let point = to(t);
      context.moveTo(point.x, point.y);
      while (t < Math.PI) {
        t += 0.01; // baby steps!
        point = to(t);
        context.lineTo(point.x, point.y);
      }
      context.closePath();

      // create the fill
      context.fillStyle = "#FF5CA4";
      context.fill();

      // create the image
      const image = new Image();
      image.src = canvas.toDataURL();
      return image;
    })();

    // render that thing!
    function render(): void {
      // next animation frame
      requestAnimationFrame(render);

      // update time
      const newTime = new Date().getTime() / 1000;
      const deltaTime = newTime - (time || newTime);
      time = newTime;

      // clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // create new particles
      const amount = particleRate * deltaTime;
      for (let i = 0; i < amount; i++) {
        const pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
        const dir = pos.clone().length(settings.particles.velocity) as Point;
        particles.add(
          canvas.width / 2 + pos.x,
          canvas.height / 2 - pos.y,
          dir.x,
          -dir.y
        );
      }

      // update and draw particles
      particles.update(deltaTime);
      particles.draw(context, image);
    }

    // handle (re-)sizing of the canvas
    function onResize(): void {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }

    window.addEventListener("resize", onResize);

    // delay rendering bootstrap
    setTimeout(function () {
      onResize();
      render();
    }, 10);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="box">
      <canvas id="pinkboard" ref={canvasRef}></canvas>
      <div className="center-text">I Love You</div>
      <div className="center-text">Phạm Thanh Thảo</div>
    </div>
  );
};

export default HeartAnimation3;
