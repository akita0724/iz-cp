//コースID取得時に実行
function get_Courses() {
    const optionalArgs = {pageSize: 20};
    try {
      const response = Classroom.Courses.list(optionalArgs);
      const courses = response.courses;
      if (!courses || courses.length === 0) {
        console.log('No courses found.');
        return;
      }
      for (const course of courses) {
        console.log('%s (コースID : %s)', course.name, course.id);
      }
    } catch (err) {
      console.log('Failed with error %s', err.message);
    }
  }
  
  const ids = [["", ""], //コースID
               ["", ""]]; //表示名
  const sheet_id = ""; //URLを保存するスプレッドシートのID
  const sheet_name = ""; //URLを保存するスプレッドシートのシート名
  const token = "*******"; //LINE Notify のアクセストークン

  
  function main() {
    const sheet = SpreadsheetApp.openById(sheet_id).getSheetByName(sheet_name);
  
    let value = sheet.getRange(1, 1, 1000).getValues();
    value = value.flat();
  
    let announcementsList = [];
  
    for (let i = 0; i <ids[0].length; i++){
      let links = [];
      try{
        let course = Classroom.Courses.Announcements.list(ids[i]);
        for(let announcements of course.announcements){
          let link = announcements.alternateLink;
          let text = announcements.text;
  
          let response = value.indexOf(link);
          if (response == -1){
            announcementsList.push([ids[1][i], text]);
            links.push([link]);
          }
        }
      }catch(e){
        continue;
      }
      console.log(links)
      if (links.length != 0){
        sheet.getRange(sheet.getRange(1, i + 1).getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow() + 1, i + 1, links.length, 1).setValues(links);
      }
    }
    for (let msg of announcementsList){
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