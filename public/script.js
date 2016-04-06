(function() {
    function getJSON(url, successHandler, errorHandler) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = 'json';
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    successHandler(xhr.response);
                } else {
                    errorHandler(xhr.status);
                }
            }
        };
        xhr.send();
    }

    function sendJSON(data) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/submit", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send(data);
    }

    var tree,
        body = document.body,
        mainContainer = document.getElementById('container'),
        rootTree = mainContainer.querySelector('.rootTree');

    /*
    Sending get-request to receive predefined array of items
    */
    getJSON("/tree.json", function(data) {
        tree = applyIds(data, null);
        buildTree(rootTree, tree);
    }, function(status) {
        alert('Something went wrong.');
    });

    /*
    Applying ids. Nested items got ids like "0_1_0" that 
    corresponds to the path to item: tree[0].tree[1].tree[0]
    */
    function applyIds(data, index) {
        data.forEach(function(v, i) {
            if (index !== null) {
                v.id = index + '_' + i;
            } else {
                v.id = i;
            }
            var parentId = v.id;

            if (v.tree) {
                applyIds(v.tree, parentId);
            }
        });
        return data;
    }

    /*
    Building tree and appending it to the DOM with recirsive function call
    for nested items.
    */
    function buildTree(parent, arr) {
        for (var i = 0; i < arr.length; i++) {

            var li = document.createElement("li");
            li.innerHTML = arr[i].text;
            li.dataset.id = arr[i].id; // setting item's id to data-id attribute 

            if (arr[i].link) {
                var a = document.createElement("a");
                a.href = arr[i].link;
                a.innerHTML = arr[i].link.split("//")[1] || arr[i].link;
                li.appendChild(a);
            }
            if (arr[i].image) {
                var img = document.createElement("img");
                img.src = "./images/" + arr[i].image;
                img.alt = arr[i].image.split(".")[0];
                li.insertBefore(img, li.childNodes[0]);
            }
            parent.appendChild(li);
            var subTree = parent.lastChild;


            if (arr[i].tree && arr[i].tree.length > 0) {
                subTree.className = arr[i].treeClass || "inactive";
                var ul = document.createElement("ul");
                subTree.appendChild(ul);
                var subsubTree = subTree.getElementsByTagName("ul")[0];
                buildTree(subsubTree, arr[i].tree);
            }
        }
    }

    /*
    Delegating events of nested items to rootTree element 
    */
    rootTree.addEventListener('click', classToggle);
    rootTree.addEventListener('contextmenu', buildContextMenuContainer);

    function buildContextMenuContainer(e) {
        removeContainer(body, document.getElementsByClassName("contextMenuContainer")[0]);
        removeContainer(mainContainer, document.getElementsByClassName("formContainer")[0]);

        var target;
        if (e.target.tagName === "LI" && e.target.tagName !== "UL") {
            e.preventDefault();
            target = e.target;
        } else return;

        var clickedItmeId = target.dataset.id;

        var addItem = document.createElement("div");
        addItem.className = "contextMenuContainer";
        addItem.innerHTML = "Add Item";

        body.appendChild(addItem);

        addItem.style.position = "absolute";
        addItem.style.left = e.clientX + 20 + "px";
        addItem.style.top = e.clientY - 65 + "px";

        addItem.addEventListener("click", function() {
            buildInputContainer(clickedItmeId);
        });
    }

    function removeContainer(parent, child) {
        if (child) {
            parent.removeChild(child);
        }
    }

    /*
    Hiding ContextMenu
    */
    body.addEventListener("click", function() {
        removeContainer(body, document.getElementsByClassName("contextMenuContainer")[0]);
    });

    /*
    Building form for input
    */
    function buildInputContainer(clickedItmeId) {
        removeContainer(body, document.getElementsByClassName("contextMenuContainer")[0]);

        var form = document.createElement("form");
        form.className = "formContainer";
        form.innerHTML = "<ul><li><label>Add new item *</label>" +
            "<input type='text' class='field' placeholder='required field' required/>" +
            "</li><li>" +
            "<label>URL </label>" +
            "<input type='url' class='field' />" +
            "</li><li>" +
            "<button>Cancel</button><input type='submit' value='Submit' />" +
            "</li></ul>";

        container.appendChild(form);
        var input = container.querySelector("input[type='text']"),
            urlInput = container.querySelector("input[type='url']"),
            cancel = container.querySelector("button");
        input.focus();
        cancel.addEventListener("click", function(e) {
            removeContainer(container, form);
        });
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            updateTreeArr([clickedItmeId, input.value, urlInput.value]);
        });
    }

    /*
    Handler that switches css classes. Also it calls updateTreeArr function to update value of 
    class in tree array, so a state of tree will not change after page refresh.
    */
    function classToggle(e) {
        var target;

        if (e.target.tagName === "LI" && e.target.lastElementChild && e.target.lastElementChild.tagName === "UL") {
            target = e.target;
        } else if (e.target.tagName === "IMG" && e.target.parentNode.tagName === "LI" &&
                    e.target.parentNode.lastElementChild.tagName === "UL") {
            target = e.target.parentNode;
        } else return;

        target.className = target.className === "active" ? "inactive" : "active";

        var clickedItmeId = target.dataset.id;
        var clickedItmeClass = target.className;

        updateTreeArr([clickedItmeId, , , clickedItmeClass]); //two empty cells are 'reserved' by previous function
    }

    /*
    This function parses id, finds destnation object and adds new item into it.
    Or just updates object's class value to keep state of tree.
    In both cases then updated array is send to server
    */
    function updateTreeArr(valueArr) {
        var item,
            ids = valueArr[0].split("_");

        for (var i = 0; i < ids.length; i++) {
            if (i === 0) {
                item = tree[ids[i]];
            } else {
                item = item.tree[ids[i]]; // tree array structure: tree[*].tree[*].tree[*]
            }
        }

        if (valueArr[3]) {
            item.treeClass = valueArr[3];
        } else {
            if (item.tree) {
                var len = item.tree.length;
                item.tree[len] = { text: valueArr[1], link: valueArr[2], treeClass: "inactive" };
            } else {
                item.tree = [{ text: valueArr[1], link: valueArr[2], treeClass: "inactive" }];
            }

            removeContainer(container, document.getElementsByClassName("formContainer")[0]);
            if (rootTree.hasChildNodes()) { // removing old tree
                while (rootTree.firstChild) {
                    removeContainer(rootTree, rootTree.firstChild);
                }
            }
            applyIds(tree, null); // applying data-id to updated tree
            buildTree(rootTree, tree); // rebuilding tree
        }

        sendJSON(JSON.stringify(tree));
    }
})();
