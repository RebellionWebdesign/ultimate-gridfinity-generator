// Parameters of the connector tab (owner, 11 November 2026): the variant, how many are made
// and the colour. A connector joins two baseplates that lie side by side: one for every cell
// at the edge, on every side.
import { variantOf, type Connectable } from "../gridfinity/connector";
import { STONE } from "./lidParams";

export interface ConnectorParams {
  variant: Connectable;
  /** as many as the baseplate has edge cells (the number follows the baseplate) */
  copies_auto: boolean;
  copies: number;
  plate_color: string;
}

export const CONNECTOR_COPIES = { min: 1, max: 200 } as const;

export const DEFAULT_CONNECTOR: ConnectorParams = {
  variant: "edge_slot",
  copies_auto: true,
  copies: 1,
  plate_color: STONE,
};

/** Cells at the edge of a plate of this many cells, counted on every side: 2 x (width + depth). */
export const edgeCells = (unitsX: number, unitsY: number): number =>
  2 * (unitsX + unitsY);

/** How many connectors to make for the plate (units of the baseplate). */
export const copiesOf = (p: ConnectorParams, unitsX: number, unitsY: number): number =>
  Math.min(CONNECTOR_COPIES.max, p.copies_auto ? edgeCells(unitsX, unitsY) : p.copies);

export const validateConnector = (p: ConnectorParams): string[] => {
  const errors: string[] = [];
  if (!variantOf(p.variant)) errors.push("Choose a connector variant.");
  if (
    !Number.isFinite(p.copies) ||
    p.copies < CONNECTOR_COPIES.min ||
    p.copies > CONNECTOR_COPIES.max
  ) {
    errors.push(
      `copies must be between ${CONNECTOR_COPIES.min} and ${CONNECTOR_COPIES.max}.`,
    );
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(p.plate_color)) {
    errors.push("plate_color must be a #rrggbb colour.");
  }
  return errors;
};
