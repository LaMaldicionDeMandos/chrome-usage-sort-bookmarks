function Bookmark(bookmarkNode, counts) {
  this.id = bookmarkNode.id;
  this.parentId = bookmarkNode.parentId;
  this.index = bookmarkNode.index;
  this.name = bookmarkNode.title;
  this.url = bookmarkNode.url;
  this.counts = counts || Bookmark.createEmptyCounts();
  this.completeCounts = function() {
    var date = new Date();
    var month = date.getMonth();
    var year = date.getFullYear();
    var time = year*12 + month;
    var counts = this.counts || Bookmark.createEmptyCounts();
    var countsTime = counts[0].year*12 + counts[0].month;
    while(time > countsTime++) {
      this.counts.unshift(Bookmark.createEmptyCount());
    }
    this.counts = counts;
  };

  this.count = function() {
    this.completeCounts(this.counts);
    var ret = 0;
    for (i = 12;i>0;i--) {
      ret+= this.counts[12 - i] != undefined ? this.counts[12 - i].count*i : 0;
    }
    return ret;
  };

  this.use = function(callback) {
    var date = new Date();
    var lastCounts = this.counts[0];
    if (date.getMonth() != lastCounts.month || date.getFullYear() != lastCounts.year) {
      lastCounts = Bookmark.createEmptyCount();
      this.counts.unshift(lastCounts);
    }
    lastCounts.count++;
    var dto = {};
    var self = this;
    dto[this.url] = this.counts;
    chrome.storage.sync.set(dto, function() {
      callback(self);
    });
  };

  this.move = function(index) {
    if ( this.index != index) {
      chrome.bookmarks.move(this.id, {'index':index});
      console.log("Change bookmark: " + this.name + " index: " + index);
      this.index = index;
    }
  };
};

Bookmark.createEmptyCount = function() {
  var date = new Date();
  return {month: date.getMonth(), year: date.getFullYear(), count: 0};
};

Bookmark.createEmptyCounts = function() {
  return [Bookmark.createEmptyCount()];
};

var bookmarks = undefined;
var processTree = function(tree) {
	console.log('Bookmarks: ' + tree.id + ' ' + tree.index + ' ' + tree.title + " url: " + tree.url);
  if (tree.url) {
    var bookmark = new Bookmark(tree);
    bookmarks[tree.url] = bookmark;
    chrome.storage.sync.get(tree.url, function(values) {
      bookmark.counts = values != undefined ? values[tree.url] || Bookmark.createEmptyCounts() : Bookmark.createEmptyCounts();
      console.log("bookmark: {url: " + bookmark.url + ", count: " + bookmark.count() + "}");
    });
  }
};

var acumulateTrees = function(trees) {
	for (i = 0; i< trees.length; i++) {
  		processTree(trees[i]);
  		chrome.bookmarks.getChildren(trees[i].id, acumulateTrees);
  	}
};

var initBookmarks = function(roots) {
  bookmarks = {};
  acumulateTrees(roots);
};

var findBookmarkByUrl = function(url) {
  return bookmarks[url];
};

var findChildren = function(parentId) {
  var children = [];
  for (url in bookmarks) {
    if (bookmarks[url].parentId == parentId) {
      children.push(bookmarks[url]);
    }
  }
  return children;
};

var calculateBookmarkPosition = function(bookmark) {
  var books = findChildren(bookmark.parentId);
  books.sort(function(a, b) {
    if (a.count() > b.count()) return -1;
    if (a.count() < b.count()) return 1;
    return (a.index <= b.index) ? -1 : 1;
  });
  for (var index = 0; index < books.length;index++) {
    if (books[index].id == bookmark.id) {
      bookmark.move(index);
    }
    books[index].index = index;
    console.log("Bookmark: " + books[index].name + " -- Index: " + books[index].index + " -- Points: " + books[index].count());
  }
};

chrome.runtime.onInstalled.addListener(function() {
  chrome.bookmarks.getTree(initBookmarks);
});

chrome.runtime.onStartup.addListener(function() {
  chrome.bookmarks.getTree(initBookmarks);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (bookmarks == undefined) {
    chrome.bookmarks.getTree(initBookmarks);  
  }
  if (changeInfo.status == 'loading' && changeInfo.url != undefined) {
    var url = changeInfo.url;
    console.log("Finding: " + url)
    bookmark = findBookmarkByUrl(url);
    if (bookmark != undefined) {
      console.log("Found bookmark: " + bookmark.name);
      bookmark.use(calculateBookmarkPosition);
    }
  }
});