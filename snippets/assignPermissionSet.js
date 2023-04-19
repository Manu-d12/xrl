/*
Apex Implementation
PermissionSetAssignment psa = new PermissionSetAssignment(PermissionSetId = myPermissionSetId, AssigneeId = myAssigneeId);
insert psa;
*/

Custom Action implementation

function(lst, scope, libs) {
    let prmSetId = '0PS5G000002bMxC';
    let prmSet = [];
    lst.forEach((i) => {
        if (!i.SetupOwnerId.startsWith('005')) return;
        prmSet.push({
            PermissionSetId: prmSetId,
            AssigneeId: i.SetupOwnerId
        })
    });
    libs.remoteAction(scope, 'saveRecords', {
        records: prmSet,
        sObjApiName: 'PermissionSetAssignment',
        isInsert: true,
        callback: function(resultCmd, result) {
            libs.showToast(scope,{
                title : "BINGO",
                message : "Updated records - " + result[resultCmd].length,
                variant : "success",
                mode : "sticky"
             })
        }
    });
}