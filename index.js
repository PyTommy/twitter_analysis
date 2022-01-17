var env = {
	TWITTER_API_KEY: '', // Twitter Developers Portalから作成する
	TWITTER_API_SECRET: '', // Twitter Developers Portalから作成する
	SPREAD_SHEET_ID: '', // GSSのID
	USER_SHEET_NAME: 'ユーザー',
	ACTION_DATA_SHEET_NAME: 'アクションデータ',
	WATCH_LIST_SHEET_NAME: 'Watchリスト',
};

var header = [
	'id',
	'type',
	'tweet.id',
	'user.id',
	'user.name',
	'user.username',
	'user.created_at',
	'user.protected',
	'user.location',
	'user.url',
	'user.description',
	'user.verified',
	'user.followers_count',
	'user.tweet_count',
	'user.listed_count',
	'user.following_count',
];

function main() {
	var watchingTweetIds = getWatchingTweetIds();
	var userActions = getUserActions(watchingTweetIds);
	var savedActionIds = getSavedActionIds();
	var newActions = userActions.filter((a) => !savedActionIds.includes(a.id));
	appendActionsToGSS(userActions);
}

// ===========
// twitterAPIのコアサービス
// ===========
function getOAuthURL() {
	Logger.log(getTwitterService().authorize());
}

function getTwitterService() {
	return OAuth1.createService('Twitter')
		.setAccessTokenUrl('https://api.twitter.com/oauth/access_token')
		.setRequestTokenUrl('https://api.twitter.com/oauth/request_token')
		.setAuthorizationUrl('https://api.twitter.com/oauth/authorize')
		.setConsumerKey(env.TWITTER_API_KEY)
		.setConsumerSecret(env.TWITTER_API_SECRET)
		.setCallbackFunction('authCallback')
		.setPropertyStore(PropertiesService.getUserProperties());
}

function authCallback(request) {
	var twitterService = getTwitterService();
	var isAuthorized = twitterService.handleCallback(request);
	if (isAuthorized) {
		return HtmlService.createHtmlOutput('認証が正常に終了しました');
	} else {
		return HtmlService.createHtmlOutput('認証がキャンセルされました');
	}
}

// ===========
// twitterAPI: GET
// ===========
/**
 * getLinkingUsers - ツイートをLikeしたユーザー一覧取得
 * 参照: https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/get-tweets-id-liking_users
 {
   id: string,
   name: string,
   username: string,
   created_at: Date, // 2021-10-20T14:36:38.000Z
   protected: boolean,
   location: string,
   url: string,
   description: string, // "Observabilityの勉強中"
   verified: boolean,
   entities: {
     any[], // 面倒
   },
   public_metrics: {
      followers_count: number,
      tweet_count: number,
      listed_count: number,
      following_count:number,
   }
 }[]
 */
function getLikingUsers(tweet_id) {
	var twitterService = getTwitterService();
	var hasAccess = twitterService.hasAccess();

	if (hasAccess) {
		var twMethod = { method: 'GET' };
		try {
			var json = twitterService.fetch(
				`https://api.twitter.com/2/tweets/${tweet_id}/liking_users?tweet.fields=&user.fields=created_at,description,entities,id,location,name,protected,url,username,verified,public_metrics`,
				twMethod
			);

			return JSON.parse(json).data;
		} catch (e) {
			Logger.log('failed to fetch users.');
			return [];
		}
	} else {
		Logger.log('no access right');
	}
}

// ===========
// GSSのコア
// ===========
function getSheet(sheetId, sheetName) {
	var spreadsheet = SpreadsheetApp.openById(sheetId);
	return spreadsheet.getSheetByName(sheetName);
}

// ===========
// GSS API: GET
// ===========
/**
 * watchリストのtweet_id一覧取得
 * @return - string[]
 */
function getWatchingTweetIds() {
	var sheet = getSheet(env.SPREAD_SHEET_ID, env.WATCH_LIST_SHEET_NAME);
	var tweetIds = sheet
		.getRange('A2:A')
		.getValues()
		.map((d) => d[0])
		.filter((d) => !!d);
	return tweetIds;
}

/**
 * 保存済アクションのid一覧取得
 */
function getSavedActionIds() {
	var sheet = getSheet(env.SPREAD_SHEET_ID, env.ACTION_DATA_SHEET_NAME);
	var actionIds = sheet
		.getRange('A2:A')
		.getValues()
		.map((d) => d[0])
		.filter((d) => !!d);
	return actionIds;
}

// ===========
// GSS API: POST
// ===========
function appendActionsToGSS(actions) {
	var rows = actions.map((a) => convertActionToRow(a));
	var lastRowPosition = getSavedActionIds().length + 1; // action数 + header数
	var sheet = getSheet(env.SPREAD_SHEET_ID, env.ACTION_DATA_SHEET_NAME);

	var startRowIndex = lastRowPosition + 1;
	var startColumnIndex = 1;
	var numRows = rows.length;
	var numColumns = header.length;
	sheet
		.getRange(startRowIndex, startColumnIndex, numRows, numColumns)
		.setValues(rows);
}

// ===========
// その他
// ===========
function generateAction(type, { tweet, user }) {
	return {
		id: `${type}_${tweet.id}_${user.id}`,
		type: type,
		tweet: {
			id: tweet.id,
		},
		user: {
			id: user.id || '',
			name: user.name || '',
			username: user.username || '',
			created_at: user.created_at || '',
			protected: user.protected || '',
			location: user.location || '',
			url: user.url || '',
			description: user.description || '',
			verified: user.verified || '',
			followers_count: user.followers_count || '',
			tweet_count: user.tweet_count || '',
			listed_count: user.listed_count || '',
			following_count: user.following_count || '',
		},
	};
}

function convertLikingUsersToActions(tweet, users) {
	return users.map((user) => generateAction('like', { tweet, user }));
}

function getLikingUserActions(tweet) {
	var users = getLikingUsers(tweet.id);
	var linkingUserActions = convertLikingUsersToActions(tweet, users);
	return linkingUserActions;
}

function getUserActions(tweetIds) {
	var actions = [];

	for (tweetId of tweetIds) {
		Logger.log(`[start data fetch (tweetId: ${tweetId})]`);
		var tweet = { id: tweetId };

		try {
			// Likesのアクションデータ取得
			var linkingUserActions = getLikingUserActions(tweet);
			actions.push(...linkingUserActions);
			Logger.log(`[end data fetch (tweetId: ${tweetId})]`);
		} catch (e) {
			Logger.log(
				`[end data fetch (tweetId: ${tweetId})] failed to fetch liniking users.`,
				e.message
			);
		}
	}

	return actions;
}

/**
 * dotを使って、ネストされたオブジェクトのpropertyを取得する。
 * 例:
 * const obj = {};
 * obj.a.b = "c"
 * getDependantProp(obj, "a.b") // = "c"
 *
 * 参照: https://stackoverflow.com/questions/8051975/access-object-child-properties-using-a-dot-notation-string
 */
function getDescendantProp(obj, desc) {
	var arr = desc.split('.');
	while (arr.length && (obj = obj[arr.shift()]));
	return obj;
}

function convertActionToRow(action) {
	return header.map((col) => getDescendantProp(action, col));
}
