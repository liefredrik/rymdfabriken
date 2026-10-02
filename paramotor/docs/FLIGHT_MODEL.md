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

`S = 26 m²` is the flat-area reference, `mass = 115 kg`, and `g = 9.80665 m/s²`. Using a flat rather than projected area is a coefficient convention; changing it without retuning CL/CD would double-count projection.

Lift is perpendicular to the air-relative flight path, with its vertical component reduced by bank and its lateral component producing the turn. Drag opposes the air-relative velocity. Thrust follows pilot heading and a suspension-related pitch offset. Gravity acts vertically. Velocity and position use semi-implicit integration at 1/120 s.

The attached lift coefficient is `clamp(.24 + 4.8 α + .18 meanBrake, −.35, 1.85)`. Drag is `.042 + .058 CL² + .026 + .09 meanBrake² + .045 |brakeDifference| + .48 stall`. The `.026` term is a lumped pilot, cage and line contribution referred to wing area. These are tunable approximations, not wind-tunnel measurements.

## Pitch, brakes and roll

Brake keys demand a pull from zero to full travel. Travel follows a first-order actuator at 2.2 s⁻¹, making approximately 90% travel take one second. Releasing a key raises that hand; Up overrides brake demand to zero. A/F demands full left/right lean, with a smoothed return to center.

The canopy has a damped pitch mode relative to the airflow. Its trim target is `.09 + .20 meanBrake + .008 throttle` radians. Integrating this relative mode avoids imposing a nonphysical world-attitude clamp during steep descents. Transient lift changes, speed loss and gravity then produce flare/climb/glide behavior. This is a **quasi-steady trim approximation**, not a solved aerodynamic pitching-moment model.

Bank follows a damped second-order response to differential brake, weight shift, torque and asymmetric loss of lift. Differential brake has much greater authority than weight shift; weight steering avoids the explicit brake drag term. Horizontal lift produces turn rate proportional to `L sin(bank)/(mass × horizontalAirspeed)`. Heading includes weathercock alignment and an asymmetric-stall yaw term.

The 6.6 m suspension scale sets a pendulum restoring frequency. Fore/aft swing responds to thrust and acceleration; lateral swing responds to roll. Pilot and canopy move separately on screen. The motor supplies a modest right-turn bias at high power; its sign is an assumed installation choice, not a universal paramotor property.

## Stall approximation

Each side accumulates stall when its brake exceeds 85% travel, or the model angle of attack becomes excessive. Stall develops over time and decays more slowly after release. It reduces lift/inflation, increases drag, deforms the corresponding canopy half, and adds yaw when asymmetric. Deep symmetric braking eventually produces a steep descent; releasing permits reacceleration with altitude loss.

Actual flexible-wing stall, spin, surge, cravat, line slack, negative-G unloading and collapse/reinflation are far more complex. These equations are intentionally insufficient for practicing emergency recovery procedures. No random collapse event is added merely to imply realism.

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
