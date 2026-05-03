declare module '@rnmapbox/maps/lib/module/web/MapContext' {
  import type { Context } from 'react';

  const MapContext: Context<{ map?: unknown }>;
  export default MapContext;
}
