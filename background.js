var bookmarks = {};
var processTree = function(tree) {
	console.log('Bookmarks: ' + tree.id + ' ' + tree.index + ' ' + tree.title);
  var bookmark = {};
  bookmark.id = tree.id;
  bookmark.parentId = tree.parentId;
  bookmark.url = tree.url;
  bookmark.count = 0;
  bookmarks[tree.id] = bookmark;
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
  chrome.bookmarks.getTree(initBookmarks);
});