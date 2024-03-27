'use client'
// import React, {ReactNode, SyntheticEvent} from 'react';
// import ApiCalendar from 'react-google-calendar-api';

// const apiCalendar = new ApiCalendar(config)
// console.log("config", config)

// console.log('apiCalendar', apiCalendar)

// export default function CalendarPage() {
// return(
//   <div>hello</div>
// )
// }
import 'whatwg-fetch';
import React from 'react';

import Scheduler, { SchedulerTypes } from 'devextreme-react/scheduler';

import CustomStore from 'devextreme/data/custom_store';

const getData = async (_, requestOptions) => {
  const GOOGLE_CALENDAR_URL = 'https://www.googleapis.com/calendar/v3/calendars/';
  const CALENDAR_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_API_KEY;

  const dataUrl = [GOOGLE_CALENDAR_URL, CALENDAR_ID, '/events?key=', PUBLIC_KEY].join('');

  const response = await fetch(dataUrl, requestOptions);

  const data = await response.json();

  return data.items;
};

const dataSource = new CustomStore({
  load: (options) => getData(options, { showDeleted: false }),
});

const currentDate = new Date(2017, 4, 25);
const views = ['day', 'workWeek', 'month'];

const App = () => (
  <React.Fragment>
    <div className="long-title">
      <h3>Tasks for Employees (USA Office)</h3>
    </div>
    <Scheduler
      dataSource={dataSource}
      views={views}
      defaultCurrentView="workWeek"
      defaultCurrentDate={currentDate}
      height={500}
      startDayHour={7}
      editing={false}
      showAllDayPanel={false}
      startDateExpr="start.dateTime"
      endDateExpr="end.dateTime"
      textExpr="summary"
      timeZone="America/Los_Angeles"
    />
  </React.Fragment>
);

export default App;



