var env = {
	SPREAD_SHEET_ID: "", // GSSのID
	SETTING_SHEET_NAME: '起動時間',
};

// トリガーの更新を行う関数
function UpdateTrigger(){
  // トリガーの更新
  deleteTrigger();
  setTrigger();
}
 
// トリガーを設定する関数
function setTrigger(){
  // 定義ファイルの取得
  var spreadsheet = SpreadsheetApp.openById(env.SPREAD_SHEET_ID);
  var triggerSheet = spreadsheet.getSheetByName(env.SETTING_SHEET_NAME);
  
  // 項目数を取得
  const triggerCount = triggerSheet.getRange('A').getValues().filter(String).length - 1;
  
  // トリガー設定対象の関数名を設定
  var functionName = "main";
 
  // 取得した項目数分トリガーを設定する
  for (var i = 0; i &lt; triggerCount; i++) {
    // 設定する値の取得
    var hour = triggerSheet.getRange(i + 2 , 2).getValue();
    var minute = triggerSheet.getRange(i + 2 , 3).getValue();
    
    // 時分の設定とトリガーの作成
    var setTime = new Date();
    setTime.setHours(hour);
    setTime.setMinutes(minute); 
    ScriptApp.newTrigger(functionName).timeBased().at(setTime).create();
  }
}
 
// トリガーを削除する関数
function deleteTrigger(){
  // トリガーを削除
  var triggers = ScriptApp.getProjectTriggers();
  for(var i=0; i &lt; triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == "main") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}