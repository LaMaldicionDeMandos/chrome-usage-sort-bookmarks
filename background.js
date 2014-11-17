chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status == 'loading') {
  	console.log('tabs.onUpdated -- window: ' + tab.windowId + ' tab: ' + tab.id +
      ' title: ' + tab.title + ' index ' + tab.index + ' url ' + tab.url);  	
  }

});