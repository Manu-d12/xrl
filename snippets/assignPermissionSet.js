/*
Apex Implementation
PermissionSetAssignment psa = new PermissionSetAssignment(PermissionSetId = myPermissionSetId, AssigneeId = myAssigneeId);
insert psa;
*/

Custom Action implementation

function(lst, scope, libs) {
    let prmSetId = '0PS5G000002bMxC'; // PermissionSetId, Of course we can assign more than 1 PermissionSet to same user
    let prmSet = [];
    lst.forEach((i) => {
        if (!i.SetupOwnerId.startsWith('005')) return; // Check that Custom Setting related to User and not to Profile or OrgId
        prmSet.push({
            PermissionSetId: prmSetId,
            AssigneeId: i.SetupOwnerId
        })
    });
    libs.remoteAction(scope, 'saveRecords', {
        records: prmSet,
        sObjApiName: 'PermissionSetAssignment',
        isInsert: true
    });
}