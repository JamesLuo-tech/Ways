import { Platform } from 'react-native';

import type { MapExplorerProps } from './MapExplorer.types';

const MapExplorerImpl =
  Platform.OS === 'web'
    ? require('./MapExplorer.web').MapExplorerWeb
    : require('./MapExplorer.native').MapExplorerNative;

export function MapExplorer(props: MapExplorerProps) {
  return <MapExplorerImpl {...props} />;
}
