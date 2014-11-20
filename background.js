var bookmarks = {};
var processTree = function(tree) {
	console.log('Bookmarks: ' + tree.id + ' ' + tree.index + ' ' + tree.title);
  var bookmark = {};
  bookmark.id = tree.id;
  bookmark.parentId = tree.parentId;
  bookmark.index = tree.index;
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

var findBookmarkByUrl = function(url) {
  for (id in bookmarks) {
    if (bookmarks[id].url == url) {
      return bookmarks[id];
    }
  }
  return null;
};

var findChildren = function(parentId) {
  var children = [];
  for (id in bookmarks) {
    if (bookmarks[id].parentId == parentId) {
      children.push(bookmarks[id]);
    }
  }
  return children;
};

chrome.windows.onCreated.addListener(function() {
  chrome.bookmarks.getTree(initBookmarks);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  console.log("Change tab: {status: " + changeInfo.status + ", url: " + changeInfo.url);
  if (changeInfo.status == 'loading' && changeInfo.url != undefined) {
    var url = changeInfo.url;
    console.log("Finding: " + url)
    bookmark = findBookmarkByUrl(url);
    if (bookmark != undefined) {
      console.log("Found bookmark: " + bookmark.id);
      bookmark.count++;
      var dto = {};
      dto[bookmark.id] = bookmark.count;
      chrome.storage.sync.set(dto, function() {
        console.log("New bookmark count: " + bookmark.count);
        var books = findChildren(bookmark.parentId);
        books.sort(function(a, b) {
          if (a.count > b.count) return -1;
          if (a.count < b.count) return 1;
          return (a.index <= b.index) ? -1 : 1;
        });
        for (var index = 0; index < books.length;index++) {
          if (books[index].index != index) {
            chrome.bookmarks.move(books[index].id, {'index':index});
            books[index].index = index;
          }
        }
      });
    }
  }
});

