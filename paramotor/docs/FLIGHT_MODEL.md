# Flight research and implementation

Sources reviewed on 2 October 2026. Manufacturer documents establish the behavior and equipment scale; they do not supply a full aerodynamic coefficient dataset. The coefficients below are explicitly simulator calibration choices.

## Primary sources

1. [Ozone Mojo PWR 2 pilot manual](https://cdn1.flyozone.com/wp-content/uploads/sites/2/2018/09/Mojo-PWR-2-manual-EN-v1.1.pdf), printed pages 12–16: progressive powered launch, pitch and torque effects, weight shift followed by brake for coordinated turns, and progressive landing flare. The model uses these qualitative relationships. It starts with the canopy already inflated, omitting the manual’s inflation procedure.
2. [Ozone Mojo PWR 2 specifications](https://flyozone.com/paramotor/products/gliders/mojo-pwr-2): the size 26 has 26 m² flat area, 22.1 m² projected area, 11.29 m flat span, 8.75 m projected span, 2.95 m root chord and 40 cells, with an 80–130 kg PPG weight range. These informed the generic visual wing and 115 kg all-up configuration. This is not an Ozone product reproduction or endorsement.
3. [GIN Vantage 4 manual, version 1.1](https://static.gingliders.com/paramotoring/vantage-4/documents/Vantage4_manual-EN_1.1.pdf), printed pages 14–17 and 22–25: power-related torque and oscillations, hang-point sensitivity, minimum-sink braking, excess braking, pendulum motion, stall and spin. These support the model’s separate brake/weight controls, damped suspension modes and penalties for deep brake travel. GIN’s reflex-wing speed-system guidance is not generalized into this simulator; trims and a speed bar are absent.
4. [Vittorazi Moster 185 Plus specifications](https://vittorazi.com/en/motori/moster-185/): 184.7 cc, 25 hp at 7,800 rpm, up to 75 kgf static thrust with a 125 cm propeller, and 3 L/h at a stated 30 kgf static thrust operating point. The simulator uses 735 N maximum static thrust as a scale reference. Its thrust-vs-speed and fuel curves are simplified fitted functions, not measured Moster curves.

## State and coordinate system

Meters, seconds, kilograms, newtons and radians. World Y points up; heading zero points toward world −Z (map north), positive heading turns toward +X (east). Positive bank, differential brake and weight input turn right. Coordinates are local, not latitude/longitude.

Translational state is position and ground-relative velocity. Wind is sampled in world space. Airspeed, flight-path angle and air-relative track are computed from `velocity − wind`. This distinction makes wind change drift and groundspeed without imposing a fictitious universal airspeed penalty. Airborne starts initialize with the wind added to trim velocity.

## Force model

```text
ρ = 1.225 exp(−altitude / 8500)
q = ½ ρ V²
L = q S CL × inflation
D = q S CD
T = 735 × throttle^1.55 × clamp(1 − V/48, .25, 1) × ρ/1.225
acceleration = (lift vector + drag vector + thrust vector) / mass + gravity
```

`S` is the selected flat area, default 26 m², `mass = 115 kg`, and `g = 9.80665 m/s²`. Using a flat rather than projected area is a coefficient convention; changing it without retuning CL/CD would double-count projection.

Lift is perpendicular to the air-relative flight path, with its vertical component reduced by bank and its lateral component producing the turn. Drag opposes the air-relative velocity. Thrust follows pilot heading and a suspension-related pitch offset. Gravity acts vertically. Velocity and position use semi-implicit integration at 1/120 s.

The attached lift coefficient is `clamp(.24 + 4.8 α + .18 meanBrake, 0, 1.85)`. Each half retains a lift fraction `(1 − .79 sideStall) × (1 − .85 sideCollapse)`; their average scales CL. Drag is `.042 + .058 CLattached² + .026 × 26/S + .09 min(meanBrake,1.4)² + .045 |brakeDifference| + .48 stall + .28 collapse`. The pilot/cage contribution retains its reference drag area as wing size changes. These are tunable approximations, not wind-tunnel measurements.

## Pitch, brakes and roll

Holding a brake key advances travel continuously at .65 reference travels per second on the 26 m² wing, with no upper input cap. Releasing raises that hand with a 2.2 s⁻¹ actuator response; Up overrides demand to zero. A/F demands left/right lean, with a smoothed return to center. Touch circles support progressive hold, analog downward drag, sideways lean and independent release. Force calculations saturate deformation at 2.5 reference travels and arm animation has finite reach: unbounded commands cannot create unlimited fabric deformation or force. 100% is a reference deep-brake position, not a universal physical stall threshold.

The canopy has a damped pitch mode relative to the airflow. Its trim target is `.09 + .20 meanBrake + .008 throttle` radians. Integrating this relative mode avoids imposing a nonphysical world-attitude clamp during steep descents. Transient lift changes, speed loss and gravity then produce flare/climb/glide behavior. This is a **quasi-steady trim approximation**, not a solved aerodynamic pitching-moment model.

Bank retains angular momentum with nonlinear restoring and damping forces, without a bank-angle clamp. Differential brake, weight shift, torque and asymmetric loss of lift drive roll. Alternating inputs can build wingovers. A coupled surge oscillator responds to brake, stall and flight-path changes; abrupt release from deep braking can produce low incidence and collapse. Horizontal lift produces turn rate proportional to `L sin(bank)/(mass × horizontalAirspeed)`. Heading includes airflow alignment and asymmetric stall/collapse yaw. These are reduced-order modes, not solved aerodynamic moment equations.

The 6.6 m suspension scale sets a pendulum restoring frequency. Fore/aft swing responds to thrust and acceleration; lateral swing responds to roll. Pilot and canopy move separately on screen. The motor supplies a modest right-turn bias at high power; its sign is an assumed installation choice, not a universal paramotor property.

## Stall approximation

Each side accumulates stall through a brake transition near .83–.98 reference travel, or excessive local incidence. A collapse of the opposite half lowers the remaining half's brake stall threshold. Stall develops over time, reduces lift, increases drag, deforms fabric and adds asymmetric yaw. Deep symmetric braking produces a steep descent; release permits reacceleration with altitude loss and possible surge.

Independent leading-edge collapse states respond to low incidence, a steep unloaded wingover or A-riser input (Z/X, or mobile A-RISERS mode). Reopening depends on dynamic pressure, positive incidence, released risers and absence of stall. The folded half loses lift and adds drag/yaw; canopy geometry visibly folds. No random collapse timer is used. Line tension is a heuristic proxy, not a solved flexible suspension system. Cravats, line wrapping, reserve deployment, full tumbling and real emergency recovery techniques are not simulated reliably.

## Size range and steering verification

- [Ozone Roadster 4](https://flyozone.com/paramotor/products/gliders/roadster-4) lists 20, 22, 24, 26, 28 and 30 m². [Freeride 2](https://flyozone.com/paramotor/products/gliders/freeride-2) lists nominal sport sizes 14–21, actual flat areas 13.8–20.8 m². [GIN Pegasus 4](https://www.gingliders.com/en/paramotoring/beginner-and-intermediate/pegasus-4/) spans 24.1–31.64 m². The slider covers **14–32 m² in 1 m² steps**, as actual generic area rather than a manufacturer model name.
- Area changes preserve 115 kg all-up mass and the generic profile/aspect ratio. For `k = sqrt(S/26)`, span, chord and suspension lengths scale by k; pilot and engine remain the same size. Wing loading is 115/S. Lift and drag use selected area; airspeed consequently varies approximately as `sqrt(W/S)`. Roll/pitch/pendulum frequencies scale with `1/sqrt(k)`, and held brake travel advances at `.65/k`, representing constant hand speed on differently sized brake paths. These response scalings are similarity assumptions, not measured handling data. Changing area restarts the flight and persists the selection locally.
- A calm 60-second run initialized at 1,000 m MSL gives approximately 52.6, 46.5, 42.1, 38.8 and 35.0 km/h for areas 14, 18, 22, 26 and 32 m²; corresponding sink is 2.49, 2.01, 1.70, 1.50 and 1.28 m/s. These are simulator outputs. At equal bank a faster wing need not turn faster; coordinated turn rate still depends on airspeed.
- [SCOUT's paramotor geometry discussion](https://www.scoutaviation.com/paramotoring/paramotor-knowledge-center/paramotor-geometry/), parts 3 and 14, supports leaning toward the intended turn and explains center-of-gravity/carabinier loading. **Intentional weight right means right turn.** The pilot animation now separates deliberate lean from inertial harness swing instead of reversing the steering sign.
- [ADVANCE OMEGA ULS maneuver discussion](https://manual.advance.ch/en/omega_uls/1903) supports qualitative low-incidence frontal collapse, tip folding from poor wingover timing and increased stall susceptibility after area loss. Its different wing architecture and collapse-training procedures are not reproduced here.

Mobile devices receive independent captured-pointer brake circles and thrust, a reduced HUD and a camera framing that keeps the pilot and canopy above the controls. Former bright rectangular field overlays were removed. Sparse instanced houses occupy dry, relatively flat terrain with tree clearances and building collision proxies. The marked mown airstrip remains intentionally distinct.

## Environment and ground interaction

- Three deterministic air masses: calm, light valley breeze, and gusty thermal afternoon.
- Wind strength grows with height near the surface. Thermals use Gaussian cores with surrounding weaker sink; the core drifts with height. This is prescribed weather, not CFD.
- Ground starts assume an overhead, inflated wing. An automatic running force supplements thrust below 7 m/s; liftoff occurs when lift exceeds weight and sufficient airspeed exists. There is no foot-running control or inflation/kiting simulation.
- Contact is assessed at the pilot’s feet. Touchdown requires vertical speed gentler than −2.5 m/s, groundspeed below 9.5 m/s, and bank below 0.3 rad. These are game thresholds, not human injury criteria.
- Trees and buildings use conservative cylindrical collision proxies. The canopy does not have its own full collision hull. Water contact and leaving the ±5.9 km local boundary end the flight.
- The collision height is the analytic terrain function; rendered terrain samples it on a grid. Steep-slope contact is approximate. The marked airfield is flat and consistent between them.

## Calibration and verification

At roughly 1,000 m MSL in still air, after stabilization, the current automated scenarios produce approximately:

| Scenario | True airspeed | Vertical speed |
| --- | --- | --- |
| Hands-off glide | 10.8 m/s / 39 km/h | −1.5 m/s |
| Full power | 10.5 m/s / 38 km/h | +3.3 m/s |
| 40% symmetric brakes | 8.3 m/s / 30 km/h | −1.1 m/s |
| Sustained full brakes | 9.3 m/s total velocity, mostly vertical | approximately −8.9 m/s |

These are outputs of the simulator, not verified performance claims for the reference equipment. All-up weight is fixed; fuel decreases but its small mass change is not integrated.

Tests verify glide envelope, power/climb relationship, minimum-sink braking, steering direction and symmetry, actuator response, hands-up override, symmetric/asymmetric stall and recovery, transient flare, wind drift, integration convergence, ground takeoff, touchdown, fuel exhaustion, world bounds, long-run finite state, and terrain topology. Browser tests additionally exercise the real keyboard and check for JavaScript and shader errors. No real-pilot validation has been performed.
