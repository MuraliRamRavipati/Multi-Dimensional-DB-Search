var userId = "";
var properties;
var index;

$(document).ready(function () {
  $("#tableId").empty();
  var url = 'http://127.0.0.1:5000/dbweb1/?query={domains{domainName}}';
  $.ajax({
    url: url,
    type: 'GET',
    success: function (response) {
      console.log(response);
      var dmns = response.data.domains;
      var htmlCode = "<select id='domainSelectId' onchange='populateCriteria()'>" +
        "<option value='' id='None'>Select a Domain</option>";
      for (var i = 0; i < dmns.length; i++)
        htmlCode += "<option value='" + dmns[i].domainName + "'>" + dmns[i].domainName + "</option>";
      htmlCode += "</select>";
      $("#domainDiv").append(htmlCode);
    },
    error: function (error) {
      alert("ERROR");
      console.log(error);
    }
  });
});

function clearSelections() {
  $("input[type='radio']").prop("checked", false);
  $("input[type='checkbox']").prop("checked", false);
  // $("select[multiple='multiple']").prop('selected', false);
  $("select[multiple='multiple']").empty();
  // $("select").prop("selectedIndex", -1);
  // $('option:selected', this).remove();
  $(".resultId").empty();
  $("#tableId").empty();
  // $("#resultsDiv").empty();
}

function resetUser() {
  $("#userWelcome").css("display", "none");
  $("#heading1Block:nth-child(2)").css("width", "");
  $("#heading1Block:nth-child(2)").css("color", "");
  $("#userId").val('');
  $("#userInput").css("display", "");
  userId="";
  // $("#userIdDiv").append("<span>userid: </span><input type='text' onchange='userIdChange()' id='userId'>");
}

$(document).ready(function () {
  $('input').bind("enterKey", function (e) {
    userId = $(this).val();
    var url = 'http://127.0.0.1:5000/dbweb1/?query={user(userid:"' + userId + '"){userid}}';
    $.ajax({
      url: url,
      type: 'GET',
      success: function (response) {
        console.log(response);
        var jsonObject = response.data.user;
        if (jsonObject.length > 0) {
          $("#userInput").css("display", "none");
          $("#userWelcome").empty();
          $("#heading1Block:nth-child(2)").css("width", "11%");
          $("#heading1Block:nth-child(2)").css("color", "blue");
          $("#userWelcome").append("Welcome, " + jsonObject[0].userid);
          $("#userWelcome").css("display", "");
          getBookmarks();
        } else {
          alert("No user found");
        }
      },
      error: function (error) {
        alert("ERROR");
        console.log(error);
      }
    });
  });
  $('input').keyup(function (e) {
    if (e.keyCode == 13) {
      $(this).trigger("enterKey");
    }
  });
});

function getBookmarks() {
  $("#bookmarks").empty();
  if ($("#domainSelectId").val().length != 0 && userId.length != 0) {
    var url = 'http://127.0.0.1:5000/dbweb1/?query={bookmarks(userid:"' + userId + '", domainName:"' + $("#domainSelectId").val() + '"){bname}}';
    $.ajax({
      url: url,
      type: 'GET',
      success: function (response) {
        console.log(response);
        var jsonObject = response.data.bookmarks;
        if (jsonObject.length < 5) {
          $('#addBookmarkButton').prop('disabled', false);
        } else {
          $('#addBookmarkButton').prop('disabled', true);
        }
        if (jsonObject.length > 0) {
          $("#bookmarks").append("<span>Bookmarks</span>");
        }
        jsonObject.forEach((bookmark) => {
          var bookmarkDiv = "<div id='bookmark'>";
          bookmarkDiv = bookmarkDiv + "<button class='bookmarkButton' onClick='getBookmarkResults(" + '"' + bookmark.bname + '"' + ")'>" + bookmark.bname + "</button>";
          bookmarkDiv = bookmarkDiv + "<button class='bookmarkButton' onClick='deleteBookmark(" + '"' + bookmark.bname + '"' + ")'></button>";
          bookmarkDiv = bookmarkDiv + "</div>";
          $("#bookmarks").append(bookmarkDiv);
        });
        if (jsonObject.length > 0) {
          $("#bookmarks").append("</div>");
        }
      },
      error: function (error) {
        alert("ERROR");
        console.log(error);
      }
    });
  }
}

function getBookmarkResults(bookmarkName) {
  var url = 'http://127.0.0.1:5000/dbweb1/?query={bookmarkResults(userid:"' + userId + '", domainName:"' + $("#domainSelectId").val() + '",bookmarkName:"' + bookmarkName + '"){name url}}';
  $.ajax({
    url: url,
    type: 'GET',
    success: function (response) {
      displayBookmarkResultsTable(response);
    },
    error: function (error) {
      alert("ERROR");
      console.log(error);
    }
  });
}

function displayBookmarkResultsTable(response) {
  console.log(response);
  $(".resultId").remove();
  $("#tableId tr").remove();
  $("#resultsDiv").append("<p class='resultId'>Sql Query:  " + response.data.bookmarkResults[response.data.bookmarkResults.length - 1].url + "</p>");
  var table = $("#tableId");
  var header = $("<tr>");
  if ($("#domainSelectId").val() == "Colleges") {
    header.append($("<th>").text("name"));
  } else {
    header.append($("<th>").text("autoid"));
  }
  header.append($("<th>").text("url"));
  table.append(header);
  $.each(response.data.bookmarkResults, function (index, item) {
    var row = "<tr>";
    row = row + "<td>" + item.name + "</td>";
    row = row + "<td><a href='" + item.url + "'>" + item.url + "</a></td>";
    row = row + "</tr>";
    table.append(row);
  });
  $("#resultsDiv").append(table);
  $('table tr:last').remove();
}

function addBookmark() {
  queryParamsString = getQueryParams();
  if (queryParamsString.length == 0 && $("#textBoxBookmark").val().length == 0) {
    alert('select atleast one property\nenter bookmark name');
  } else if (queryParamsString.length == 0) {
    alert('select atleast one property');
  } else if ($("#textBoxBookmark").val().length == 0) {
    alert('enter bookmark name');
  }
  if (queryParamsString.length > 0 && $("#textBoxBookmark").val().length > 0) {
    var url = 'http://127.0.0.1:5000/dbweb1/?query=mutation{createBookmark(userid:"' + userId + '", domainName:"' + $("#domainSelectId").val() + '",bname:"' + $("#textBoxBookmark").val() + '",bookmark:"' + queryParamsString + '"){ok}}';
    $.ajax({
      url: url,
      type: 'POST',
      success: function (response) {
        getBookmarks();
        textBoxBookmark
        $("$textBoxBookmark").val('');
      },
      error: function (error) {
        alert("ERROR");
        console.log(error);
      }
    });
  }
}

function deleteBookmark(bookmarkName) {
  queryParamsString = getQueryParams();
  var url = 'http://127.0.0.1:5000/dbweb1/?query=mutation{deleteBookmark(userid:"' + userId + '", domainName:"' + $("#domainSelectId").val() + '",bname:"' + bookmarkName + '"){ok}}';
  $.ajax({
    url: url,
    type: 'POST',
    success: function (response) {
      getBookmarks();
    },
    error: function (error) {
      alert("ERROR");
      console.log(error);
    }
  });
}

function submitQuery() {
  queryParamsString = getQueryParams();
  var url = 'http://127.0.0.1:5000/dbweb1/?query={results(domainName:"' + $("#domainSelectId").val() + '",queryParams:"' + queryParamsString + '"){ name url }}';
  $.ajax({
    url: url,
    type: 'GET',
    success: function (response) {
      displayResultsTable(response);
    },
    error: function (error) {
      alert("ERROR");
      console.log(error);
    }
  });
}

function displayResultsTable(response) {
  console.log(response);
  $(".resultId").remove();
  $("#tableId tr").remove();
  $("#resultsDiv").append("<p class='resultId'>Sql Query: " + response.data.results[response.data.results.length - 1].url + "</p>");
  var table = $("#tableId");
  var header = $("<tr>");
  if ($("#domainSelectId").val() == "Colleges") {
    header.append($("<th>").text("name"));
  } else {
    header.append($("<th>").text("autoid"));
  }
  header.append($("<th>").text("url"));
  table.append(header);
  $.each(response.data.results, function (index, item) {
    var row = "<tr>";
    row = row + "<td>" + item.name + "</td>";
    row = row + "<td><a href='" + item.url + "'>" + item.url + "</a></td>";
    row = row + "</tr>";
    table.append(row);
  });
  $("#resultsDiv").append(table);
  $('table tr:last').remove();
}

function getQueryParams() {
  var selected = {
    "radio": [],
    "checkbox": [],
    "multiselect": []
  };
  $("#popCriteriaId").children().children().each(function () {
    $(this).find("*").each(function () {
      var type = $(this).attr("type");
      if (type === "radio" && $(this).is(":checked")) {
        selected.radio.push({
          "value": $(this).val(),
          "name": $(this).attr("name")
        });
      } else if (type === "checkbox" && $(this).is(":checked")) {
        selected.checkbox.push({
          "value": $(this).val(),
          "name": $(this).attr("name")
        });
      } else {
        $(this).find("option:selected").each(function () {
          selected.multiselect.push({
            "value": $(this).val(),
            "name": $(this).attr("name")
          });
        });
      }
    });
  });
  console.log(selected);
  var queryParamsString = "";
  var b = {};
  var a = selected;
  $.each(a, function (key, value) {
    var values = [];
    $.each(value, function (i, v) {
      if (!b.hasOwnProperty(v.name)) {
        b[v.name] = [v.value];
      } else {
        b[v.name].push(v.value);
      }
    });
  });

  var queryParamsString = "";
  $.each(b, function (key, value) {
    if (value.length != 1) {
      queryParamsString += ":";
      queryParamsString += key + "=" + value.join("." + key + "=") + ";, ";
    }
    else {
      queryParamsString += key + "=" + value.join("." + key + "=") + ", ";
    }
  });
  queryParamsString = queryParamsString.slice(0, -2);
  console.log(queryParamsString);
  return queryParamsString;
}

function populateCriteria() {
  clearSelections();
  resetUser();
  getBookmarks();
  $("#popCriteriaId").empty();
  $("#paginationId").empty();
  var url = 'http://127.0.0.1:5000/dbweb1/?query={properties(domainName:"' + $("#domainSelectId").val() + '"){propertyName propertyQuestion propertyDisplayType propertyDetails{ allowedValue allowedValueCode}}}';
  $.ajax({
    url: url,
    type: 'GET',
    success: function (response) {
      console.log(response);
      properties = response.data.properties;
      index = 0;
      for (var i = 0; i <= Math.floor(properties.length / 3); i++) {
        var jsonObject = properties.slice(i * 3, (i + 1) * 3);
        displayAllProperties(jsonObject, i);
      }
      displayPageProperties(index);
      if (properties.length > 0) {
        $("#paginationId").empty();
        $("#paginationId").append("<button class='navitem' onClick='clearSelections()'>Reset</button>");
        $("#paginationId").append("<button class='navitem' id='nextId' onClick='next()'>Next</button>");
        $("#paginationId").append("<button class='navitem' id='previosId' onClick='previous()'>Previous</button>");
        $("#paginationId").append("<button class='navitem' id='submitId' onClick='submitQuery()'>Search</button>");
        $("#paginationId").append("<span class='addLabel'>Bookmark Name:</span>");
        $("#paginationId").append("<input class='navitem' id='textBoxBookmark' type='text' >");
        $("#paginationId").append("<button class='navitem' id='addBookmarkButton' onClick='addBookmark()' disabled>Add Bookmark</button>");
      }
      if (index == 0) {
        $('#previosId').prop('disabled', true);
      }
    },
    error: function (error) {
      alert("ERROR");
      console.log(error);
    }
  });
};

function displayAllProperties(jsonObject, index) {
  var propertyDiv = "<div id='page" + index + "'>";
  var propertyHtml = "";
  jsonObject.forEach((property) => {
    propertyHtml += "<div id=" + property.propertyName + "Div" + ">";
    propertyHtml += "<p>" + property.propertyQuestion + "</p>";
    var idNum = 1;
    if (property.propertyDisplayType == "radio" || property.propertyDisplayType == "checkbox") {
      property.propertyDetails.forEach((detail) => {
        propertyHtml += '<input type="' + property.propertyDisplayType + '" id="' + property.propertyName + 'Id' + idNum + '" name="' + property.propertyName + '" value="' + detail.allowedValueCode + '"><label for="' + property.propertyName + 'Id' + '">' + detail.allowedValue + '</label><br>';
        idNum += 1;
      });
    } else {
      propertyHtml += "<select name='" + property.propertyName + "' id='" + property.propertyName + 'Id' + idNum + "' multiple>";
      property.propertyDetails.forEach((detail) => {
        propertyHtml += '<option name="' + property.propertyName + '" value="' + detail.allowedValueCode + '">' + detail.allowedValue + '</option>';
      });
      propertyHtml += "</select>";
    }
    propertyHtml += "</div>";
  });
  propertyDiv += propertyHtml;
  propertyDiv += "</div>";
  $("#popCriteriaId").append(propertyDiv);
}

function displayPageProperties(index) {
  for (var i = 0; i <= Math.floor(properties.length / 3); i++) {
    if (i != index) {
      $("#page" + i).css("display", "none");
    } else {
      $("#page" + i).css("display", "");
    }
  }
}

function next() {
  var lengthQ = Math.floor(properties.length / 3);
  var lengthR = (properties.length % 3);
  if ((lengthR > 0 && index < lengthQ) || (lengthR == 0 && index < lengthQ - 1)) {
    index = index + 1;
    displayPageProperties(index);
  }
  if ((lengthR > 0 && index == lengthQ) || (lengthR == 0 && index == lengthQ - 1)) {
    $('#nextId').prop('disabled', true);
  }
  if (index > 0) {
    $('#previosId').prop('disabled', false);
  }
}

function previous() {
  var lengthQ = Math.floor(properties.length / 3);
  var lengthR = (properties.length % 3);
  if (index > 0) {
    index = index - 1;
    displayPageProperties(index);
  }
  if (index == 0) {
    $('#previosId').prop('disabled', true);
  }
  if ((lengthR > 0 && index < lengthQ) || (lengthR == 0 && index < lengthQ - 1)) {
    $('#nextId').prop('disabled', false);
  }
}
