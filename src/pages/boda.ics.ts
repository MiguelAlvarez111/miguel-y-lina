import {calendarEvent} from '../config/wedding';
import {calendarIcs} from '../lib/event';
export function GET(){return new Response(calendarIcs(calendarEvent),{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'attachment; filename="boda.ics"'}});}
