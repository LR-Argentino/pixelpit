import { Params } from '@angular/router';
import { IconName } from '../../shared/ui/icon/icons';

export interface NavLink {
  label: string;
  icon: IconName;
  path: string;
  queryParams?: Params;
  /** Für Gäste sichtbar, aber erst nach der Anmeldung nutzbar */
  locked?: boolean;
}
