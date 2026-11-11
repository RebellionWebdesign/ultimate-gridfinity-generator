// Baseplate connectors (owner, 11 November 2026; not part of the Gridfinity standard).
// Variant 1 comes from the owner's drawing and his STEP file `base_con.stp`: the slot in the
// edge of the baseplate (the left half of the drawing) and the connector (the right half).
// The coordinates were read from the faces of that file, not from the hand-written numbers
// of the drawing (they agree). Profiles are in mm as [u, z]: u across the profile, z up from
// the underside (the bed); the slot's u runs from the plate edge inward, the connector's u
// from its middle to the right.

export type Point2 = [number, number];

export interface ConnectorVariant {
  id: string;
  /** the name in the menu */
  name: string;
  /** the slot cut into the edge of a baseplate, u from the plate edge inward */
  slot: Point2[];
  /** how long the slot is along the edge (STEP: 20.0; the connector is 0.4 shorter) */
  slotLength: number;
  /** the connector, u from its middle */
  connector: Point2[];
  connectorLength: number;
  source: string;
}

const SOURCE =
  "owner's drawing and STEP file base_con.stp, 11 November 2026 (slot 20.0 long, connector 19.6 long)";

/** Variant 1: slot with a 1.3 wide bar and a flange under it, and a connector with a roof. */
export const EDGE_SLOT: ConnectorVariant = {
  id: "edge_slot",
  name: "Variant 1",
  // the left of the drawing: bar 1.3 x 2.0, notch 0.4 + 0.5 (0.3 across), flange 0.7 high with a
  // 45 degree end, 2.85 deep in all
  slot: [
    [0, 0],
    [2.85, 0],
    [2.15, 0.7],
    [1.0, 0.7],
    [1.0, 1.1],
    [1.3, 1.5],
    [1.3, 2.0],
    [0, 2.0],
  ],
  slotLength: 20,
  // the right of the drawing: 4.3 wide, 1.65 high walls, a 45 degree roof ending in a flat top
  // 0.4242 wide at 3.5879, underneath a channel 2.1 wide at the opening (0.25 high), widening
  // by 0.4 per side over 0.533 to 2.9, up to 1.35
  connector: [
    [-0.2121, 3.5879],
    [-2.15, 1.65],
    [-2.15, 0],
    [-1.05, 0],
    [-1.05, 0.25],
    [-1.45, 0.783],
    [-1.45, 1.35],
    [1.45, 1.35],
    [1.45, 0.783],
    [1.05, 0.25],
    [1.05, 0],
    [2.15, 0],
    [2.15, 1.65],
    [0.2121, 3.5879],
  ],
  connectorLength: 19.6,
  source: SOURCE,
};

export const CONNECTOR_VARIANTS: readonly ConnectorVariant[] = [EDGE_SLOT];

export type Connectable = "none" | "edge_slot";

export const variantOf = (id: Connectable): ConnectorVariant | undefined =>
  CONNECTOR_VARIANTS.find((v) => v.id === id);
