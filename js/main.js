/*jshint browser:true*/
/*global MashupPlatform*/

(function() {

	"use strict";
	
	var taxi_attributes = ['id','type','taxiPosition'];
	var id_query = 0; /* ad ogni query viene assegnato un id */
	var listDataQuery = []; /* contiene le response di tutte le query ordinate per idquery*/

	
	 var create_ngsi_connection = function create_ngsi_connection() {
        var ngsi = new NGSI.Connection(MashupPlatform.prefs.get('ngsi_server'), {
            use_user_fiware_token: true,
        });
        return ngsi;
    };
    
	var QueryWidget = function QueryWidget() {
		
		this.ngsi_server = null;
		this.connection = null;
		this.attribute_name = null;
		
		//this.serviceId = "Service1";
		this.serviceId = null;
		
		this.contenitore = null;
		this.my_body = null;
		this.table = null;
		this.footer = null;
		this.table_footer = null;
		

	};

	QueryWidget.prototype.init = function init() {
		
		this.ngsi_server = MashupPlatform.prefs.get('ngsi_server');
		this.serviceId = MashupPlatform.prefs.get('service_id');
		
		var my_body = document.getElementsByTagName("body")[0];
		var contenitore = document.createElement("div");
		contenitore.setAttribute("id","idContenitore");
		this.my_body = my_body;
		this.contenitore = contenitore;
		
		createTableFooter.call(this);
		this.footer = document.createElement("div");
		this.footer.setAttribute("id","footer");
		this.footer.appendChild(this.table_footer);
		this.my_body.appendChild(this.footer);
		
		createTableOutPut.call(this);
		this.contenitore.appendChild(this.table);
		this.my_body.appendChild(this.contenitore);
		this.connection = create_ngsi_connection();
		
        // Set input callbacks:
        MashupPlatform.wiring.registerCallback("InputEntity", handlerEntityInput.bind(this));
        
        // Set preference callbacks:
        MashupPlatform.prefs.registerCallback(handlerPreferences.bind(this));
        
        standardRoutine.call(this);

	};
	
	var standardRoutine = function standardRoutine(){

		/*
		this.connection = create_ngsi_connection();
		var conn = "Connection OK\n\n";
		var divText = document.createTextNode(conn);
		this.contenitore.appendChild(divText);
		*/
		doQuery.call(this);
	};
	
	var handlerEntityInput = function handlerEntityInput(serviceEntityString){
		var serviceEntity = JSON.parse(serviceEntityString);
		var serviceID = serviceEntity.id;
		
		this.serviceId = serviceID;
		
		/*
		 * scrivo sull' header della outputTable il servizio selezionato
		 */
		var d = new Date();
		var h = d.getHours();
		var m = d.getMinutes();
		var s = d.getSeconds();
		var current_date = '['+h+':'+m+':'+s+']';
		
		var footer = document.getElementById("footerTable");
		var row = footer.insertRow(0);
		var mgs = row.insertCell(0);
		mgs.innerHTML = current_date + '[' +'The selected service is ' + this.serviceId + ']';
		
		var idMsg = row.insertCell(1);
		idMsg.innerHTML = "0";
		
		doQuery.call(this);
		
		
	};

	var doQuery = function doQuery(){
		
		var servID = this.serviceId;
		var position = "taxiPosition";
		
		this.connection.query([{
				type : "",
				isPattern : true,
				id : ".*"
			}],
			[
				 servID
			],
			{
				flat : true,
				onSuccess: onQuerySuccess.bind(this),
				onFailure: onQueryFail.bind(this)
			});
	};
	
	var onQuerySuccess = function onQuerySuccess(data){
		var entitiesList = data;
		/*
		var linea = "--------------------" + "\n";
		var ok = "OnSuccess --> Query OK\n";
		var info = JSON.stringify(data) + "\n";
		var testo = linea + ok + info + linea;
		var response = document.createTextNode(testo);
		this.contenitore.appendChild(response);
		*/
		
		id_query = id_query + 1;
		var d = new Date();
		var h = d.getHours();
		var m = d.getMinutes();
		var s = d.getSeconds();
		var current_date = '['+h+':'+m+':'+s+']';
		
		//aggiorno la tabella footer per informare della nuova querySuccess
		var footer = document.getElementById("footerTable");
		var row = footer.insertRow(0);
		var mgs = row.insertCell(0);
		mgs.innerHTML = current_date + '['+ 'onSuccess' + ']';
		
		var mgsQueryId = row.insertCell(1);
		mgsQueryId.innerHTML = id_query; 
		/*aggiungo l'handler per la riga, quando verrÃ  cliccata la riga verrannÃ²
		 * caricate le response della query nella tabella outputTable
		 */
		row.addEventListener("click", handlerClickRow.bind(this, row), false);
		
		//salvo in lista i risultati della query
		var oneElement = {};
		oneElement.response = data; /*oggetti taxi */
		oneElement.id = id_query;
		listDataQuery[id_query] = oneElement;
		
		//richiamo la deleteTableOutPut() cancello tutte le righe tranne l'header
		deleteTableOutPut.call(this);
		//richiamo la updateTableOutPut()
		
		updateTableOutPut.call(this, oneElement);
		/*
		for(var i in data)
		{
			//sono taxi...ma cambierÃ 
			var tmp = data[i];
			
			
			
			var type = '';
			var id = '';
			var taxiPosition = '';
			//sono taxi...ma cambierÃ 
			var tmp = data[i];
			id = tmp.id;
			type = tmp.type;
			taxiPosition = tmp.taxiPosition;
			
			var table_output = document.getElementById("outputTable");
			var row = table_output.insertRow(1);
			
			var idc = row.insertCell(0);
			idc.innerHTML = id;
			var typec = row.insertCell(1);
			typec.innerHTML = type;
			var taxiPositionc = row.insertCell(2);
			taxiPositionc.innerHTML = taxiPosition;
			var idqc = row.insertCell(3);
			idqc.innerHTML = id_query;
			
		}
		*/
		
		for(var attr in entitiesList){
			//var entity = JSON.stringify(entitiesList[attr]);
			var entity = entitiesList[attr];
			var taxiID = "";
			var taxiType = "";
			taxiID = entity.id;
			taxiType = entity.type;
			
			//new code test
			var position = "taxiPosition";
			var temperature = "temperature";
			var pressure = "pressure";
			var pm10 = "PM10";
			this.connection.query([{
				type : taxiType,
				isPattern : false,
				id : taxiID
			}],
			[
				 this.serviceId,
				 position,
				 temperature,
				 pressure,
				 pm10
			],
			{
				flat : true,
				onSuccess: onQuerySuccess1.bind(this),
				onFailure: onQueryFail1.bind(this)
			});
			//end new code test
			
			//MashupPlatform.wiring.pushEvent("OutputEntities", entity);
		}
		
		
	};
	
	var onQuerySuccess1 = function onQuerySuccess1(data1){
		var taxiEntity = "";
		for(var attr1 in data1){
		taxiEntity = JSON.stringify(data1[attr1]);
		
		MashupPlatform.wiring.pushEvent("OutputEntities", taxiEntity);
		}
	};
	
	var onQueryFail1 = function onQueryFail1(error){
		
		var errorText = error;
	};
	
	var onQueryFail = function onQueryFail(error){
		var connError = error;
		/*
		var linea = "----------------" + "\n";
		var ok = "OnFailure --> Query is not OK\n";
		var info = JSON.stringify(error);
		var testo = linea + ok + info + linea;
		var response = document.createTextNode(testo);
		this.contenitore.appendChild(response);
		*/
		var d = new Date();
		var h = d.getHours();
		var m = d.getMinutes();
		var s = d.getSeconds();
		var current_date = '['+h+':'+m+':'+s+']';
		
		var footer = document.getElementById("footerTable");
		var row = footer.insertRow(0);
		var mgs = row.insertCell(0);
		mgs.innerHTML = current_date + '['+ 'onFailure' + ']';
		var mgsQueryId = row.insertCell(1);
		mgsQueryId.innerHTML = "0"; 
	};
	
    var handlerPreferences = function handlerPreferences() {

       standardRoutine.call(this);
    };
    
    /*
     * table
     */
    var handlerClickRow = function handlerClickRow(rowSelected)
    {
    	var cells = rowSelected.cells;
    	//seleziono id della query
		var id = cells[1].innerHTML;
		
		deleteTableOutPut.call(this);
		if(id === "0")
			return;
		
		var data = listDataQuery[id];
		updateTableOutPut.call(this, data);
    }
    
    var updateTableOutPut = function updateTableOutPut(data){
    	/* inserisce tutti i risultati della query 
    	 * selezionata nella tabella outputTable
    	 * data Ã¨ un oggetto oneElement contenuto in listDataQuery
    	 * oneElement.id -> id della quey
    	 * oneElement.response -> oggetti taxi .id .type .position
    	 */
    	var queryList = data.response;
    	var id = data.id;
    	var table = document.getElementById("outputTable");
    	for(var i in queryList){
	        var row = table.insertRow(1);
	        //row.addEventListener("click", handlerClickRow.bind(this, row), false);
	        var cell_id = row.insertCell(0);
	        var cell_type = row.insertCell(1);
	        var cell_pos = row.insertCell(2);
	        var cell_idquery = row.insertCell(3);
	        
	        var tmp = queryList[i];
	        cell_id.innerHTML = tmp.id;
	        cell_type.innerHTML = tmp.type;
	        cell_pos.innerHTML = tmp.taxiPosition;
	        cell_idquery.innerHTML = id;
	        
	        //row.addEventListener("click", handlerClickRow.bind(this, row), false);
    	}
    };
    
    var deleteTableOutPut = function deleteTableOutPut(){
    	var table = document.getElementById("outputTable");
    	var nrows = table.rows.length;
    	if(nrows>1){//se c'Ã¨ qualche riga (row=1 header)
	    	for(var i=0; i<nrows-1; i++)//l'header non lo cancello
	    	{
	    		table.deleteRow(1);
	    	}
    	}
    };
    var createTableFooter = function createTableFooter()
    {
    	var table_footer = document.createElement("table");
    	table_footer.setAttribute("id","footerTable");
    	var tbody = document.createElement("tbody");
    	table_footer.appendChild(tbody);
    	this.table_footer = table_footer;
    };
    
    var createTableOutPut = function createTableOutPut()
    {
    	var num_col = 3;
    	var table_output = document.createElement("table");
    	table_output.setAttribute("id","outputTable");
    	var tbody = document.createElement("tbody");
    	table_output.appendChild(tbody);
    	
    	var row_header = document.createElement("tr");
    	
    	for(var i=0; i<num_col; i++)
    	{
    		var new_cell = document.createElement("th");
    		new_cell.innerHTML =  taxi_attributes[i];
    		row_header.appendChild(new_cell);
    	}
    	
    	//creo la cella dell'id della query
    	var idquery_cell = document.createElement("th");
    	idquery_cell.innerHTML = "idQuery"
    	row_header.appendChild(idquery_cell);
    	
    	
    	tbody.appendChild(row_header);
    	
    	this.table = table_output;
    }; 
    
    var insertEntityIntoTabble = function insertEntityIntoTabble(entity)
    {
    	var d = new Date();
		var h = d.getHours();
		var m = d.getMinutes();
		var s = d.getSeconds();
		var current_date = '['+h+':'+m+':'+s+']';
		
    	var table = document.getElementById("outputTable");
    	var row = table.insertRow(1)
    	var cell_time = row.insertCell(0);
    	cell_time.innerHTML = current_date;
    	
    	for(var i=0; i<taxi_atributes.lenght; i++)
    	{
    		var mgs = row.insertCell(i+1);
    		mgs.innerHTML = text;
    	}
    	
    };
	
	
	window.QueryWidget = QueryWidget;

})();

var queryWidget = new QueryWidget();

window.addEventListener("DOMContentLoaded", queryWidget.init.bind(queryWidget), false);