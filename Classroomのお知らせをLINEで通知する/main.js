const url = ""; //スプレッドシートのURL
const sheet_name = "シート1"; // シート名
const token = ""; //Line Notifyトークン

function init(){
  const pattern = /^https:\/\/docs.google.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit#gid=([0-9]+)$/;
  const result = url.match(pattern);
  if (!result){
    console.log("無効なURLです。");
    return
  }
  const book = SpreadsheetApp.openByUrl(url);

  const res = book.getSheetByName("コース一覧");
  if (!res){
    book.insertSheet().setName("コース一覧");
  }
  const sheet_course = book.getSheetByName("コース一覧");
  let courses = get_Courses();
  sheet_course.clear();
  sheet_course.getRange(1, 1, 1, 3).setValues([["クラス名", "コースID", "送信"]]);
  sheet_course.getRange(2, 1, courses.length, 2).setValues(courses);
  sheet_course.getRange(2, 3, courses.length, 1).insertCheckboxes().uncheck();
  func(true);
  console.log("処理完了");
}

function get_Courses(){
  const optionalArgs = {pageSize: 20};
  let list = []
  try {
    const response = Classroom.Courses.list(optionalArgs);
    const courses = response.courses;
    if (!courses || courses.length === 0) {
      console.log('No courses found.');
    }
    for (course of courses){
      list.push([course.name, course.id])
    }
    }catch (err) {
    console.log('Failed with error %s', err.message);
  }
  return list
}

function func(all) {
  const book = SpreadsheetApp.openByUrl(url);
  const sheet_course = book.getSheetByName("コース一覧");
  const sheet_list = book.getSheetByName(sheet_name);

  const couses_to_send = sheet_course.getRange(2, 1, sheet_course.getLastRow() - 1, 3).getValues();

  let ids = [[], []];

  if (!all){
    for (let couse of couses_to_send){
      if (couse[2] == true){
        ids[0].push(couse[1]);
        ids[1].push(couse[0]);
      }
    }
  }else{
    for (let course of couses_to_send){
      ids[0].push(course[1]);
      ids[1].push(course[0])

    }
  }
  let value = sheet_list.getRange(1, 1, 1000, 10).getValues();
  value = value.flat();

  let announcementsList = [];
  let links = [];

  for (let i = 0; i <ids[0].length; i++){
    try{
    const optionalArgs = {pageSize: 10}
      let course = Classroom.Courses.Announcements.list(ids[0][i], optionalArgs);
      for(let announcements of course.announcements){
        let link = announcements.alternateLink;
        let text = announcements.text;

        let response = value.indexOf(link);
        if (response == -1){
          announcementsList.push([ids[1][i], text]);
          links.push(link.slice(32));
        }
      }
    }catch(e){
      continue;
    }
  }
  let values = [];
  for(let i = 0; 0 < links.length; i){
    values.push(links.splice(i, 10));
  }

  const len_ = values.length - 1;

  let len = values[len_].length;
  while (len < 10){
    values[len_].push('');
    len = len + 1;
  }

  sheet_list.getRange(1, 1,values.length, values[0].length).setValues(values);

  return announcementsList;
}

function main(){
  const announcements = func(false);
  for (let msg of announcements){
    let message = "[" + msg[0] + "]\n" + msg[1];
    sendToLine(message);
  }
}

function sendToLine(message){
  const options =
   {
     "method"  : "post",
     "headers" : {"Authorization" : "Bearer "+ token},
     "payload" : "message=" + message
   };
   UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
}
