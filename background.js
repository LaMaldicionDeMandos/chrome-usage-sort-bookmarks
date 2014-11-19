var bookmarks = {};
var processTree = function(tree) {
	console.log('Bookmarks: ' + tree.id + ' ' + tree.index + ' ' + tree.title);
  var bookmark = {};
  bookmark.id = tree.id;
  bookmark.parentId = tree.parentId;
  bookmark.url = tree.url;
  bookmark.count = 0;
  bookmarks[tree.id] = bookmark;
  chrome.storage.sync.get(tree.id, function(count) {
    bookmark.count = count[tree.id] | 0;
    console.log("bookmark: {id: " + bookmark.id + ", count: " + bookmark.count + "}");
  });
};

var acumulateTrees = function(trees) {
	for (i = 0; i< trees.length; i++) {
  		processTree(trees[i]);
  		chrome.bookmarks.getChildren(trees[i].id, acumulateTrees);
  	}
};

var initBookmarks = function(roots) {
  acumulateTrees(roots);
  bookmarks = roots;
};

chrome.windows.onCreated.addListener(function() {
//  chrome.storage.sync.set({'0':12}, function() {
//  });
  chrome.bookmarks.getTree(initBookmarks);
});