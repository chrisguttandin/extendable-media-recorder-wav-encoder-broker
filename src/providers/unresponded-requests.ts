import { InjectionToken } from '@angular/core';

export const unrespondedRequests = new InjectionToken<Set<number>>('UNRESPONDED_REQUESTS');
