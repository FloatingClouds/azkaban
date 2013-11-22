/*
 * Copyright 2012 LinkedIn Corp.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

$.namespace('azkaban');

var projectView;
azkaban.ProjectView = Backbone.View.extend({
	events: {
		"click #project-upload-btn": "handleUploadProjectJob",
		"click #project-delete-btn": "handleDeleteProject"
	},

	initialize: function(settings) {
	},

	handleUploadProjectJob: function(evt) {
		console.log("click upload project");
		$('#upload-project-modal').modal();
	},

	handleDeleteProject: function(evt) {
		console.log("click delete project");
		$('#delete-project-modal').modal();
	},
	
	render: function() {
	}
});

var uploadProjectView;
azkaban.UploadProjectView = Backbone.View.extend({
	events: {
		"click #upload-project-btn": "handleCreateProject"
	},

	initialize: function(settings) {
		console.log("Hide upload project modal error msg");
		$("#upload-project-modal-error-msg").hide();
	},
	
	handleCreateProject: function(evt) {
		console.log("Upload project button.");
		$("#upload-project-form").submit();
	},
	
	render: function() {
	}
});

var deleteProjectView;
azkaban.DeleteProjectView = Backbone.View.extend({
	events: {
		"click #delete-btn": "handleDeleteProject"
	},
	
	initialize: function(settings) {
	},
	
	handleDeleteProject: function(evt) {
		$("#delete-form").submit();
	},

	render: function() {
	}
});

var flowTableView;
azkaban.FlowTableView = Backbone.View.extend({
	events : {
		"click .flow-expander": "expandFlowProject",
		"mouseover .expandedFlow a": "highlight",
		"mouseout .expandedFlow a": "unhighlight",
		"click .runJob": "runJob",
		"click .runWithDep": "runWithDep",
		"click .executeFlow": "executeFlow",
		"click .viewFlow": "viewFlow",
		"click .viewJob": "viewJob"
	},

	initialize: function(settings) {
	},

	expandFlowProject: function(evt) {
		if (evt.target.tagName == "A") {
			return;
		}
		
		var target = evt.currentTarget;
		var targetId = target.id;
		var requestURL = contextURL + "/manager";

		var targetExpanded = $('#' + targetId + '-child');
		var targetTBody = $('#' + targetId + '-tbody');
		
		var createJobListFunction = this.createJobListTable;
		if (target.loading) {
			console.log("Still loading.");
		}
		else if (target.loaded) {
			$(targetExpanded).collapse('toggle');
		}
		else {
			// projectName is available
			target.loading = true;
			var requestData = {
				"project": projectName, 
				"ajax":"fetchflowjobs", 
				"flow":targetId
			};
			var successHandler = function(data) {
				console.log("Success");
				target.loaded = true;
				target.loading = false;
				createJobListFunction(data, targetTBody);
				$(targetExpanded).collapse('show');
			};
			$.get(requestURL, requestData, successHandler, "json");
		}
	},
	createJobListTable : function(data, innerTable) {
		var nodes = data.nodes;
		var flowId = data.flowId;
		var project = data.project;
		var requestURL = contextURL + "/manager?project=" + project + "&flow=" + flowId + "&job=";
		for (var i = 0; i < nodes.length; i++) {
			var job = nodes[i];
			var name = job.id;
			var level = job.level;
			var nodeId = flowId + "-" + name;
			
			var tr = document.createElement("tr");
			$(tr).addClass("jobrow");
			var idtd = document.createElement("td");
			$(idtd).addClass("tb-name");
			$(idtd).addClass("tb-job-name");
			idtd.flowId = flowId;
			idtd.projectName = project;
			idtd.jobName = name;

			if (execAccess) {
				var hoverMenuDiv = document.createElement("div");
				$(hoverMenuDiv).addClass("pull-right");
				
				var divRunJob = document.createElement("button");
				$(divRunJob).addClass("btn");
				$(divRunJob).addClass("btn-success");
				$(divRunJob).addClass("btn-xs");
				$(divRunJob).addClass("runJob");
				$(divRunJob).text("Run Job");
				divRunJob.jobName = name;
				divRunJob.flowId = flowId;
				$(hoverMenuDiv).append(divRunJob);
				
				var divRunWithDep = document.createElement("button");
				$(divRunWithDep).addClass("btn");
				$(divRunWithDep).addClass("btn-success");
				$(divRunWithDep).addClass("btn-xs");
				$(divRunWithDep).addClass("runWithDep");
				$(divRunWithDep).text("Run With Dependencies");
				divRunWithDep.jobName = name;
				divRunWithDep.flowId = flowId;
				$(hoverMenuDiv).append(divRunWithDep);
				
				$(idtd).append(hoverMenuDiv);
			}
			
			var ida = document.createElement("a");
			ida.dependents = job.dependents;
			ida.dependencies = job.dependencies;
			ida.flowid = flowId;
			$(ida).text(name);
			$(ida).addClass("jobLink");
			$(ida).attr("id", nodeId);
			$(ida).css("margin-left", level * 20);
			$(ida).attr("href", requestURL + name);
			
			$(idtd).append(ida);
			$(tr).append(idtd);
			$(innerTable).append(tr);
		}
	},
	unhighlight: function(evt) {
		var currentTarget = evt.currentTarget;
		$(".dependent").removeClass("dependent");
		$(".dependency").removeClass("dependency");
	},

	highlight: function(evt) {
		var currentTarget = evt.currentTarget;
		$(".dependent").removeClass("dependent");
		$(".dependency").removeClass("dependency");
	
		if ($(currentTarget).hasClass("jobLink")) {
			this.highlightJob(currentTarget);
		}
	},

	highlightJob: function(currentTarget) {
		var dependents = currentTarget.dependents;
		var dependencies = currentTarget.dependencies;
		var flowid = currentTarget.flowid;
		
		if (dependents) {
			for (var i = 0; i < dependents.length; ++i) {
				var depId = flowid + "-" + dependents[i];
				$("#"+depId).toggleClass("dependent");
			}
		}
		
		if (dependencies) {
			for (var i = 0; i < dependencies.length; ++i) {
				var depId = flowid + "-" + dependencies[i];
				$("#"+depId).toggleClass("dependency");
			}
		}
	},

	viewFlow: function(evt) {
		console.log("View Flow");
		var flowId = evt.currentTarget.flowId;
		location.href = contextURL + "/manager?project=" + projectName + "&flow=" + flowId;
	},

	viewJob: function(evt) {
		console.log("View Job");
		var flowId = evt.currentTarget.flowId;
		var jobId = evt.currentTarget.jobId;
		location.href = contextURL + "/manager?project=" + projectName + "&flow=" + flowId + "&job=" + jobId;
	},

	runJob: function(evt) {
		console.log("Run Job");
		var jobId = evt.currentTarget.jobName;
		var flowId = evt.currentTarget.flowId;
		
		var executingData = {
			project: projectName,
			ajax: "executeFlow",
			flow: flowId,
			job: jobId
		};
		
		this.executeFlowDialog(executingData);
	},

	runWithDep: function(evt) {
		var jobId = evt.currentTarget.jobName;
		var flowId = evt.currentTarget.flowId;
		console.log("Run With Dep");
		
		var executingData = {
			project: projectName,
			ajax: "executeFlow",
			flow: flowId,
			job: jobId,
			withDep: true
		};
		this.executeFlowDialog(executingData);
	},

	executeFlow: function(evt) {
		console.log("Execute Flow");
		var flowId = $(evt.currentTarget).attr('flowid');
		
		var executingData = {
			project: projectName,
			ajax: "executeFlow",
			flow: flowId
		};
		
		this.executeFlowDialog(executingData);
	},

	executeFlowDialog: function(executingData) {
		flowExecuteDialogView.show(executingData);
	},

	render: function() {
	}
});

var projectSummary;
azkaban.ProjectSummaryView = Backbone.View.extend({
	events: {
		"click #edit": "handleDescriptionEdit"
	},

	initialize: function(settings) {
	},
	
	handleDescriptionEdit: function(evt) {
		console.log("Edit description");
		var editText = $("#edit").text();
		var descriptionTD = $('#pdescription');
		
		if (editText != "Edit Description") {
			var requestURL = contextURL + "/manager";
			var newText = $("#descEdit").val();

			$.get(
				requestURL,
				{
					"project": projectName, 
					"ajax":"changeDescription", 
					"description":newText
				},
				function(data) {
					if (data.error) {
						alert(data.error);
					}
				},
				"json"
			);
				
			$(descriptionTD).remove("#descEdit");
			$(descriptionTD).text(newText);
			$("#edit").text("Edit Description");
		}
		else {
			var text = $(descriptionTD).text();
			var edit = document.createElement("textarea");
			
			$(edit).addClass("editTextArea");
			$(edit).attr("id", "descEdit");
			$(edit).val(text);
			$(descriptionTD).text("");
			$(descriptionTD).append(edit);
			
			$("#edit").text("Commit");
		}
	},
	render: function() {
	}
});

$(function() {
	projectView = new azkaban.ProjectView({el:$('#project-options')});
	uploadView = new azkaban.UploadProjectView({el:$('#upload-project-modal')});
	flowTableView = new azkaban.FlowTableView({el:$('#flow-tabs')});
	projectSummary = new azkaban.ProjectSummaryView({el:$('#project-summary')});
	deleteProjectView = new azkaban.DeleteProjectView({el: $('#delete-project-modal')});
	// Setting up the project tabs
});
