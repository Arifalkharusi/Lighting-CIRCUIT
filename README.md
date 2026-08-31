# Domestic Electrical Designer

A UK domestic electrical wiring trainer/simulator built with React, TypeScript, React Flow and Zustand.

## What's in here

- **21 component types** across 7 categories: distribution (consumer unit), lighting control
  (1-way/2-way/intermediate/dimmer switches), lighting loads (ceiling rose, pendant, downlight,
  batten, wall light), sockets & power (single/double/outdoor/USB), FCUs & control units
  (switched/unswitched FCU, cooker control unit), appliances (boiler, immersion heater, extractor
  fan), and junctions (5-pole connector block, 4-terminal junction box).
- **Cable size selection** — pick core colour *and* CSA (1.0–16.0 mm²) before drawing a wire; wires
  are labelled and rendered with thickness that scales with CSA. A built-in reference panel covers
  standard UK cable sizes and typical circuit design (cable + protective device) for lighting,
  sockets, cookers, showers, immersion heaters, boilers, and extractor fans.
- **Manual wiring only** — nothing auto-connects. Drag between two terminal pins to draw a
  conductor in the selected colour/CSA; click a wire and hit delete to remove it.
- **Live circuit solver** — traces L / N / E continuity from the consumer unit through every
  component's internal bridging logic (switch positions, FCU on/off, loop-in ceiling roses,
  junction boxes, etc.) and lights up lamps/appliances/sockets accordingly.
- Redesigned UI: header bar, collapsible categorised toolbox, minimap, undo/reset.

## Running it

```bash
npm install
npm run dev
```

## Notes

- Cable/circuit reference figures are indicative only (Method C, twin & earth). Always verify
  against BS 7671 for real designs — this is a wiring-logic trainer, not a design tool.
