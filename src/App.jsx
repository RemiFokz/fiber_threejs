/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { OrbitControls, shaderMaterial } from "@react-three/drei";
import data from "./assets/data.json";
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import Tubes from "./Tubes";
const randomRange = (min, max) => Math.random() * (max - min) + min;
let curves = [];
// curves
for (let i = 0; i < 100; i++) {
  // 100 curves
  let points = [];
  let length = randomRange(0.1, 1); // length of curve
  // points
  for (let j = 0; j < 100; j++) {
    // 100 points
    points.push(
      new THREE.Vector3().setFromSphericalCoords(
        // set points in spherical coordinates
        1,
        Math.PI - (j / 100) * Math.PI * length, // theta (angle from top) (between 0 and PI) (PI is top) (0 is bottom)
        (i / 100) * Math.PI * 2 // phi (angle from center) (between 0 and 2PI) (0 is front) (PI is back) (2PI is front)
      )
    );
  }
  let temp = new THREE.CatmullRomCurve3(points); // create curve
  curves.push(temp);
}

let brainCurves = [];

data.economics[0].paths.forEach((path) => {
  let points = [];
  for (let i = 0; i < path.length; i += 3) {
    points.push(new THREE.Vector3(path[i], path[i + 1], path[i + 2])); //    //
  }
  let tempcurve = new THREE.CatmullRomCurve3(points);
  brainCurves.push(tempcurve);
});

function BrainParticles({ allthecurves }) {
  let density = 70;
  let numberOfPoints = density * allthecurves.length;

  const myPoints = useRef([]);
  const brainGeo = useRef();

  let positions = useMemo(() => {
    let pos = [];
    for (let i = 0; i < numberOfPoints; i++) {
      pos.push(randomRange(-1, 1), randomRange(-1, 1), randomRange(-1, 1));
    }

    return new Float32Array(pos);
  }, [numberOfPoints]);

  let randoms = useMemo(() => {
    let rand = [];
    for (let i = 0; i < numberOfPoints; i++) {
      rand.push(randomRange(0.3, 1));
    }
    return new Float32Array(rand);
  }, [numberOfPoints]);

  useEffect(() => {
    for (let i = 0; i < allthecurves.length; i++) {
      for (let j = 0; j < density; j++) {
        myPoints.current.push({
          // add points to myPoints array
          currentOffset: Math.random(),
          speed: Math.random() * 0.002,
          curve: allthecurves[i],
          curPosition: Math.random(),
        });
      }
    }
  });

  useFrame(({ clock }) => {
    let curpositions = brainGeo.current.attributes.position.array;
    for (let i = 0; i < myPoints.current.length; i++) {
      // update position of points
      myPoints.current[i].curPosition += myPoints.current[i].speed; // update curPosition by speed (random value between 0 and 0.01)
      myPoints.current[i].curPosition = myPoints.current[i].curPosition % 1; // reset curPosition to 0 when it reaches 1 (so it loops)
      let curPoint = myPoints.current[i].curve.getPointAt(
        myPoints.current[i].curPosition
      ); // get point on curve at curPosition (between 0 and 1)
      // (0 is start of curve, 1 is end of curve)
      // (curPosition is updated every frame)
      // (curPosition is updated by speed)
      //  (speed is a random value between 0 and 0.01)
      // (curPosition is reset to 0 when it reaches 1)
      curpositions[i * 3] = curPoint.x;
      curpositions[i * 3 + 1] = curPoint.y;
      curpositions[i * 3 + 2] = curPoint.z;
    }
    brainGeo.current.attributes.position.needsUpdate = true;
  });

  const BrainParticleMaterial = shaderMaterial(
    {
      time: 0,
      color: new THREE.Color(0.1, 0.3, 0.6),
    },
    // vertext shader
    /*glsl*/ `
    varying vec2 vUv; 
      uniform float time;
      varying float vProgress; //
      attribute float randoms; // add randoms attribute
      void main() {
       vUv = uv; 
       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); // that sets the position of the vertex 
       vec4 mvPosition =  modelViewMatrix * vec4(position, 1.0); // get the position of the vertex in view space (relative to the camera)
        gl_PointSize = 2. * (1. / -mvPosition.z); // set the size of the point based on the distance from the camera 
      }
    `,
    // fragment shader
    /*glsl*/ `
      uniform float time;
      void main() {
        float disc = length(gl_PointCoord.xy - vec2(0.5)); // distance from center of the point
        float opacity = 0.1*smoothstep(0.4, 0.2, disc); 
        gl_FragColor = vec4(vec3(opacity), 1.);
      }
    `
  );

  //  that sets the position of the vertex
  extend({ BrainParticleMaterial });
  return (
    <>
      <points>
        <bufferGeometry attach="geometry" ref={brainGeo}>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-randoms"
            count={randoms.length / 3}
            array={randoms}
            itemSize={3}
          />
        </bufferGeometry>
        <brainParticleMaterial
          attach="material"
          deptTest={false}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

function App() {
  return (
    <Canvas camera={{ position: [0, 0, 0.3], near: 0.001, far: 5 }}>
      <color attach="background" args={["black"]} />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Tubes curves={brainCurves} />
      <BrainParticles allthecurves={brainCurves} />
      <OrbitControls autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}

export default App;
