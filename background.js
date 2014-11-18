var processTree = function(tree) {
	console.log('Bookmarks: ' + tree.id + ' ' + tree.index + ' ' + tree.title);
};

var acumulateTrees = function(trees) {
	for (i = 0; i< trees.length; i++) {
  		processTree(trees[i]);
  		chrome.bookmarks.getChildren(trees[i].id, acumulateTrees);
  	}
};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status == 'loading') {
  	console.log('tabs.onUpdated -- window: ' + tab.windowId + ' tab: ' + tab.id +
      ' title: ' + tab.title + ' index ' + tab.index + ' url ' + tab.url);  	
  	chrome.bookmarks.getTree(acumulateTrees);
  }
});