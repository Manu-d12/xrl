{
    "formatter": function(row, col, val) {
        let link = '/sfc/servlet.shepherd/document/download/' + row.ContentDocumentId;
        return '<a href ="' + link + '">click</a>';
    }
}