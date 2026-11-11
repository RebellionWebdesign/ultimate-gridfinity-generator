// The connector of a baseplate (owner, 11 November 2026): a prism with the profile of the
// variant, flat side down, centred on x and y, 19.6 mm long along y.
import type { Manifold } from "manifold-3d";
import type { ConnectorVariant } from "../gridfinity/connector";
import type { Kernel, Scope } from "./kernel";

/** Gap between two connectors on the bed (mm). */
export const CONNECTOR_GAP = 3;

/**
 * Several connectors side by side in rows, as many in a row as fit `maxWidth`, centred on x
 * and y. They are separate bodies of one part.
 */
export const buildConnectors = (
  kernel: Kernel,
  scope: Scope,
  variant: ConnectorVariant,
  copies: number,
  maxWidth: number,
): Manifold => {
  const one = buildConnector(kernel, scope, variant);
  if (copies <= 1) return one;
  const xs = variant.connector.map(([x]) => x);
  const width = Math.max(...xs) - Math.min(...xs);
  const pitchX = width + CONNECTOR_GAP;
  const pitchY = variant.connectorLength + CONNECTOR_GAP;
  const columns = Math.max(
    1,
    Math.min(copies, Math.floor((maxWidth + CONNECTOR_GAP) / pitchX)),
  );
  const rows = Math.ceil(copies / columns);
  const placed = Array.from({ length: copies }, (_, k) =>
    scope.add(
      one.translate(
        ((k % columns) - (columns - 1) / 2) * pitchX,
        (Math.floor(k / columns) - (rows - 1) / 2) * pitchY,
        0,
      ),
    ),
  );
  return scope.add(kernel.Manifold.compose(placed));
};

export const buildConnector = (
  kernel: Kernel,
  scope: Scope,
  variant: ConnectorVariant,
): Manifold => {
  const prism = scope.add(
    scope
      .add(new kernel.CrossSection([variant.connector]))
      .extrude(variant.connectorLength),
  );
  // (u, z, along) -> (x = u, y = -along, z): a quarter turn about x, then centred on y
  const upright = scope.add(
    prism.transform([1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1]),
  );
  return scope.add(upright.translate(0, variant.connectorLength / 2, 0));
};
