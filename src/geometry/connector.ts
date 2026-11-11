// The connector of a baseplate (owner, 11 November 2026): a prism with the profile of the
// variant, flat side down, centred on x and y, 19.6 mm long along y.
import type { Manifold } from "manifold-3d";
import type { ConnectorVariant } from "../gridfinity/connector";
import type { Kernel, Scope } from "./kernel";

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
