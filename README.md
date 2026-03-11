# Santa Cruz - Delta Airport

A premium 3D aviation experience built with Three.js. This project simulates airport ground operations, focusing on realistic airplane landing and takeoff sequences with interactive user control.

## 🚀 Features

### ✈️ Dynamic Animations
- **Realistic Landing**: A 3-phase sequence involving descent from the sky, sliding on the runway to decelerate, and taxiing to a user-selected terminal or hangar.
- **Realistic Takeoff**: A 3-phase sequence involving taxiing from a selected origin (terminal/hangar) to the runway, accelerating down the runway, and ascending into the airspace.
- **Flight Guardrails**: The system prevents overlapping animations by disabling controls during flight operations.

### 🏢 Airport Environment
- **Detailed Infrastructure**: Includes a Control Tower with radar, multiple plane hangars with Delta branding, and a spacious Airport Terminal with jet bridges.
- **Realistic Runway**: Features industry-standard markings including edge lines, dashed centerlines, threshold piano keys, aiming points, and touchdown zone bars.
- **Fleet**: Includes multiple parked Boeing 737 and Airbus A21N models.

### 🌓 Interactive Controls
- **Theme Toggle**: Switch between **Day Mode** (bright, natural lighting) and **Night Mode** (dark ambient tones with warm, orange street-lamp lighting) at the click of a button.
- **Orbit Controls**: Navigate the 3D scene freely using your mouse:
  - **Left Click + Drag**: Rotate camera.
  - **Right Click + Drag**: Pan camera.
  - **Scroll**: Zoom in/out.
- **Flight Operations**: Use the "Live" flight menu to initiate landings or takeoffs and select specific destinations.

## 🛠️ Technology Stack
- **Three.js**: Core 3D engine and rendering.
- **lil-gui**: Intuitive UI for light and camera parameter adjustments.
- **Stats.js**: Real-time performance monitoring.
- **HTML5/CSS3**: Custom premium UI design with 'Outfit' typography and Delta aesthetics.

## 🏃 How to Run
1. Ensure you have **Python** installed on your system.
2. Clone the repository and navigate to the root directory.
3. Run the provided batch file:
   ```bash
   ./webserver.bat
   ```
   (Alternatively, run `python -m http.server` in the root directory).
4. Open your browser and navigate to `http://localhost:8000/world/index.html`.

## 📂 Project Structure
- **/world**: Contains the main application entry point (`index.html`) and logic (`main.js`).
- **/models**: 3D assets for the airplanes and buildings.
- **/textures**: Environment and surface textures (checked floor, runway asphalt, skybox).
- **/helpers**: Custom utility classes for GUI integration.
- **/lib**: External libraries like Three.js and Stats.js.
