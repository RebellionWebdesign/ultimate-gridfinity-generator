// Parameters of the connector tab (owner, 11 November 2026): which variant, and its colour.
import { variantOf, type Connectable } from "../gridfinity/connector";
import { STONE } from "./lidParams";

export interface ConnectorParams {
  variant: Connectable;
  plate_color: string;
}

export const DEFAULT_CONNECTOR: ConnectorParams = {
  variant: "edge_slot",
  plate_color: STONE,
};

export const validateConnector = (p: ConnectorParams): string[] => {
  const errors: string[] = [];
  if (!variantOf(p.variant)) errors.push("Choose a connector variant.");
  if (!/^#[0-9a-fA-F]{6}$/.test(p.plate_color)) {
    errors.push("plate_color must be a #rrggbb colour.");
  }
  return errors;
};
