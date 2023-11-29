/*
All configuration need to save on custom object or metadata
Need merge admin settings and user settings

Current selected VIEW will be stored to localStorage
*/
@Deprecated
global with sharing class getSobjFields extends VisualEditor.DynamicPickList {
	VisualEditor.DesignTimePageContext context;
@Deprecated
	global getSobjFields(VisualEditor.DesignTimePageContext context) {
	}
@Deprecated
	global override VisualEditor.DataRow getDefaultValue() {
		return null;
	}
@Deprecated
	global override VisualEditor.DynamicPickListRows getValues() {
		return null;
	}
	
}