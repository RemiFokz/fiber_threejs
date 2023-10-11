/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, shaderMaterial } from "@react-three/drei";
import data from "./assets/data.json";
import * as THREE from "three";
import { useRef } from "react";

function Tube({ curve }) {
  const brainMat = useRef();

  const { viewport } = useThree();
  useFrame(({ clock, mouse }) => {
    brainMat.current.uniforms.time.value += 0.01;
    brainMat.current.uniforms.mouse.value = new THREE.Vector3(
      (mouse.x * viewport.width) / 2,
      (mouse.y * viewport.height) / 2,
      0
    );
  }); // useFrame is a hook that runs every frame
  const BrainMaterial = shaderMaterial(
    // shaderMaterial is a THREE.js material
    {
      time: 0,
      color: new THREE.Color(0.9, 0.2, 0.6),
      mouse: new THREE.Vector3(0, 0, 0),
    },
    // vertext shader
    /*glsl*/ `
      uniform float time;
      varying vec2 vUv;
      uniform vec3 mouse;
      varying float vProgress;
      void main() { // this function is called for every vertex
        vUv = uv;
        vProgress = smoothstep(-1., 1.,sin(vUv.x*8. + time *3.)); // vProgress is a value between -1 and 1 that is used to interpolate between two colors 
        vec3 p = position; // get the position of the vertex
        float maxDist = 0.01; // set the maximum distance the vertex can move
        float dist = length(mouse.xy * vUv); // get the distance between the mouse and the vertex
        if(dist < maxDist){  
          vec3 dir = normalize(mouse - p); // get the direction from the vertex to the mouse
          dir*= (1. - dist/maxDist); // scale the direction based on the distance
          p -= dir*0.004; // move the vertex in the direction
        }
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); // that sets the position of the vertex
      }
      `,
    // fragment shader
    /*glsl*/ `
      uniform float time;
      uniform vec3 color;
      varying vec2 vUv;
      varying float vProgress;
      void main() { // this function is called for every fragment
        vec3 finalColor = mix(color, color *0.25, vProgress); // mix is a THREE.js function that interpolates between two colors
        float hideCorrners = smoothstep(1.,0.9,vUv.x);
        float hideCorrners1 = smoothstep(0.,0.1,vUv.x);
        gl_FragColor.rgba = vec4(vec3(vProgress),1.); // set the color of the fragment
        gl_FragColor.rgba = vec4(finalColor, hideCorrners * hideCorrners1); // 
      }`
  );
  extend({ BrainMaterial }); // Make sure the object key is "BrainMaterial", not "brainMaterial".
  return (
    <mesh>
      <tubeGeometry args={[curve, 64, 0.001, 2, false]} />
      <brainMaterial
        depthTest={false} // disable depth test
        deprtsWrite={false} // disable depth test and depth write
        blending={THREE.AdditiveBlending} // blending mode is additive blending (the color of the fragment is added to the color of the background)
        transparent={false}
        ref={brainMat}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
export default function Tubes({ curves }) {
  return curves.map((curve, i) => <Tube key={i} curve={curve} />);
}
