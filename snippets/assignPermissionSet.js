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

//child records
function(scope,records) {
    const recordMap = new Map();
  
    records.forEach(record => {
      const { Id, ReportsToId } = record;
  
      if (!recordMap.has(Id)) {
        recordMap.set(Id, { ...record, childRecords: [] });
      }
  
      if (ReportsToId !== undefined) {
        if (!recordMap.has(ReportsToId)) {
            let r = records.find(r1 => r1.Id === ReportsToId);
          recordMap.set(ReportsToId, { ...r, childRecords: [] });
        }
        recordMap.get(ReportsToId).childRecords.push(recordMap.get(Id));
      }
    });
  
    const topLevelRecords = Array.from(recordMap.values()).filter(record => (record.ReportsToId === undefined && record.Id !== undefined));
    return topLevelRecords;
  }