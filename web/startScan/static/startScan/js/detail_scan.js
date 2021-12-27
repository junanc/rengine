function get_ips_from_port(port_number, history_id){
  document.getElementById("detailScanModalLabel").innerHTML='IPs with port ' + port_number + ' OPEN';
  var ip_badge = '';
  fetch('../port/ip/'+port_number+'/'+history_id+'/')
  .then(response => response.json())
  .then(data => render_ips(data));
}

function get_ports_for_ip(ip, history_id){
  console.log(ip, history_id);
  document.getElementById("detailScanModalLabel").innerHTML='Open Ports identified for ' + ip;
  var port_badge = '';
  fetch('../ip/ports/'+ip+'/'+history_id+'/')
  .then(response => response.json())
  .then(data => render_ports(data));
}

function render_ports(data)
{
  var port_badge = ''
  ip_address_content = document.getElementById("detailScanModalContent");
  Object.entries(JSON.parse(data)).forEach(([key, value]) => {
    badge_color = value[3] ? 'danger' : 'info';
    title = value[3] ? 'Uncommon Port - ' + value[2] : value[2];
    port_badge += `<span class='m-1 badge  badge-soft-${badge_color} bs-tooltip' title='${title}'>${value[0]}/${value[1]}</span>`
  });
  ip_address_content.innerHTML = port_badge;
  $('.bs-tooltip').tooltip();
}

function render_ips(data)
{
  var ip_badge = ''
  content = document.getElementById("detailScanModalContent");
  Object.entries(JSON.parse(data)).forEach(([key, value]) => {
    badge_color = value[1] ? 'warning' : 'info';
    title = value[1] ? 'CDN IP Address' : '';
    ip_badge += `<span class='m-1 badge  badge-soft-${badge_color} bs-tooltip' title='${title}'>${value[0]}</span>`
  });
  content.innerHTML = ip_badge;
  $('.bs-tooltip').tooltip();
}


function get_endpoints(scan_history_id, gf_tags){
  if (scan_history_id) {
    var lookup_url = `/api/listEndpoints/?scan_history=${scan_history_id}&format=datatables`;
  }
  else{
    var lookup_url = `/api/listEndpoints/?&format=datatables`;
  }
  if (gf_tags){
    lookup_url += `&gf_tag=${gf_tags}`
  }
  var endpoint_table = $('#endpoint_results').DataTable({
    "destroy": true,
    "processing": true,
    "oLanguage": {
      "oPaginate": { "sPrevious": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>', "sNext": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-right"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>' },
      "sInfo": "Showing page _PAGE_ of _PAGES_",
      "sLengthMenu": "Results :  _MENU_",
      "sProcessing": "Processing... Please wait..."
    },
    "dom": "<'row'<'col-lg-12 col-md-12 col-12 mb-2'l>>" +
    "<'row'<'col'tr>>" +
    "<'dt--bottom-section d-sm-flex justify-content-sm-between text-center'<'dt--pages-count  mb-sm-0 mb-3'i><'dt--pagination'p>>",
    "stripeClasses": [],
    "lengthMenu": [100, 200, 300, 500, 1000],
    "pageLength": 100,
    'serverSide': true,
    "ajax": lookup_url,
    "order": [[ 6, "desc" ]],
    "columns": [
      {'data': 'id'},
      {'data': 'http_url'},
      {'data': 'http_status'},
      {'data': 'page_title'},
      {'data': 'matched_gf_patterns'},
      {'data': 'content_type'},
      {'data': 'content_length', 'searchable': false},
      {'data': 'technologies'},
      {'data': 'webserver'},
      {'data': 'response_time', 'searchable': false},
    ],
    "columnDefs": [
      {
        "targets": [ 0 ],
        "visible": false,
        "searchable": false,
      },
      {
        "targets": [ 7, 8 ],
        "visible": false,
        "searchable": true,
      },
      {
        "render": function ( data, type, row ) {
          tech_badge = '';
          web_server = '';
          if (row['technologies']){
            tech_badge = `</br>` + parse_technology(row['technologies'], "primary", outline=true);
          }

          if (row['webserver']) {
            web_server = `<span class='m-1 badge badge-soft-info' data-toggle="tooltip" data-placement="top" title="Web Server">${row['webserver']}</span>`;
          }

          var url = split(data, 70);
          action_icons = `
          <div class="float-left subdomain-table-action-icons mt-2">
          <span class="m-1">
          <a href="javascript:;" data-clipboard-action="copy" class="badge-link text-primary copyable text-primary" data-toggle="tooltip" data-placement="top" title="Copy Url!" data-clipboard-target="#url-${row['id']}" id="#url-${row['id']}" onclick="setTooltip(this.id, 'Copied!')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></span>
          </a>
          </div>
          `;
          tech_badge += web_server;

          return `<div class="clipboard copy-txt">` + "<a href='"+ data +`' id="url-${row['id']}" target='_blank' class='text-primary'>`+ url +"</a>" + tech_badge + "<br>" + action_icons ;
        },
        "targets": 1,
      },
      {
        "render": function ( data, type, row ) {
          // display badge based on http status
          // green for http status 2XX, orange for 3XX and warning for everything else
          if (data >= 200 && data < 300) {
            return "<span class='badge  badge-soft-success'>"+data+"</span>";
          }
          else if (data >= 300 && data < 400) {
            return "<span class='badge  badge-soft-warning'>"+data+"</span>";
          }
          else if (data == 0){
            // datatable throws error when no data is returned
            return "";
          }
          return "<span class='badge  badge-soft-danger'>"+data+"</span>";

        },
        "targets": 2,
      },
      {
        "render": function ( data, type, row ) {
          if (data){
            return parse_comma_values_into_span(data, "info");
          }
          return "";
        },
        "targets": 8,
      },
      {
        "render": function ( data, type, row ) {
          if (data){
            return parse_comma_values_into_span(data, "danger", outline=true);
          }
          return "";
        },
        "targets": 4,
      },
      {
        "render": function ( data, type, row ) {
          if (data){
            return get_response_time_text(data);
          }
          return "";
        },
        "targets": 9,
      },
    ],
    drawCallback: function () {
      $("body").tooltip({ selector: '[data-toggle=tooltip]' });
      $('.dataTables_wrapper table').removeClass('table-striped');
      var clipboard = new Clipboard('.copyable');
      $('.bs-tooltip').tooltip();
      clipboard.on('success', function(e) {
        setTooltip(e.trigger, 'Copied!');
        hideTooltip(e.trigger);
      });
    }
  });
  $('#endpoint-search-button').click(function () {
    endpoint_table.search($('#endpoints-search').val()).draw() ;
  });
}

function get_subdomain_changes(scan_history_id){
  $('#table-subdomain-changes').DataTable({
    "drawCallback": function(settings, start, end, max, total, pre) {
      if (this.fnSettings().fnRecordsTotal() > 0) {
        $('#subdomain_change_count').empty();
        $("#subdomain_change_count").html(`<span class="badge badge-soft-primary me-1">${this.fnSettings().fnRecordsTotal()}</span>`);
        $('.recon-changes-tab-show').removeAttr('style');
        $('#subdomain_changes_alert').html(`${this.fnSettings().fnRecordsTotal()} Subdomain changes.`)
      }
      else{
        $('#recon_changes_subdomain_div').remove();
      }
      $("#subdomain-changes-loader").remove();
    },
    "oLanguage": {
      "oPaginate": { "sPrevious": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>', "sNext": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-right"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>' },
      "sInfo": "Showing page _PAGE_ of _PAGES_",
      "sSearch": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
      "sSearchPlaceholder": "Search...",
      "sLengthMenu": "Results :  _MENU_",
    },
    "processing": true,
    "dom": "<'dt--top-section'<'row'<'col-12 col-sm-6 d-flex justify-content-sm-start justify-content-center'f><'col-12 col-sm-6 d-flex justify-content-sm-end justify-content-center'l>>>" +
    "<'table-responsive'tr>" +
    "<'dt--bottom-section d-sm-flex justify-content-sm-between text-center'<'dt--pages-count  mb-sm-0 mb-3'i><'dt--pagination'p>>",
    "destroy": true,
    "stripeClasses": [],
    'serverSide': true,
    "ajax": `/api/listSubdomainChanges/?scan_id=${scan_history_id}&format=datatables`,
    "order": [[ 3, "desc" ]],
    "columns": [
      {'data': 'name'},
      {'data': 'page_title'},
      {'data': 'http_status'},
      {'data': 'content_length'},
      {'data': 'change'},
      {'data': 'http_url'},
      {'data': 'is_cdn'},
      {'data': 'is_interesting'},
    ],
    "bInfo": false,
    "columnDefs": [
      {
        "targets": [ 5, 6, 7 ],
        "visible": false,
        "searchable": false,
      },
      {"className": "text-center", "targets": [ 2, 4 ]},
      {
        "render": function ( data, type, row ) {
          badges = '';
          cdn_badge = '';
          tech_badge = '';
          interesting_badge = '';
          if (row['is_cdn'])
          {
            cdn_badge = "<span class='m-1 badge  badge-soft-warning'>CDN</span>"
          }
          if(row['is_interesting'])
          {
            interesting_badge = "<span class='m-1 badge  badge-soft-danger'>Interesting</span>"
          }
          if(cdn_badge || interesting_badge)
          {
            badges = cdn_badge + interesting_badge + '</br>';
          }
          if (row['http_url']) {
            if (row['cname']) {
              return badges + `<a href="`+row['http_url']+`" class="text-primary" target="_blank">`+data+`</a><br><span class="text-dark">CNAME<br><span class="text-warning"> ❯ </span>` + row['cname'].replace(',', '<br><span class="text-warning"> ❯ </span>')+`</span>`;
            }
            return badges + `<a href="`+row['http_url']+`" class="text-primary" target="_blank">`+data+`</a>`;
          }
          return badges + `<a href="https://`+data+`" class="text-primary" target="_blank">`+data+`</a>`;
        },
        "targets": 0
      },
      {
        "render": function ( data, type, row ) {
          // display badge based on http status
          // green for http status 2XX, orange for 3XX and warning for everything else
          if (data >= 200 && data < 300) {
            return "<span class='badge  badge-soft-success'>"+data+"</span>";
          }
          else if (data >= 300 && data < 400) {
            return "<span class='badge  badge-soft-warning'>"+data+"</span>";
          }
          else if (data == 0){
            // datatable throws error when no data is returned
            return "";
          }
          return `<span class='badge  badge-soft-danger'>`+data+`</span>`;
        },
        "targets": 2,
      },
      {
        "render": function ( data, type, row ) {
          if (data){
            return `<span class='text-center' style="display:block; text-align:center; margin:0 auto;">${data}</span>`;
          }
          return "";
        },
        "targets": 3,
      },
      {
        "render": function ( data, type, row ) {
          if (data == 'added'){
            return `<span class='badge badge-soft-success'><i class="fe-plus-circle"></i> Added</span>`;
          }
          else{
            return `<span class='badge badge-soft-danger'><i class="fe-minus-circle"></i> Removed</span>`;
          }
        },
        "targets": 4,
      },
    ],
  });
}

function get_endpoint_changes(scan_history_id){
  $('#table-endpoint-changes').DataTable({
    "drawCallback": function(settings, start, end, max, total, pre) {
      if (this.fnSettings().fnRecordsTotal() > 0) {
        $("#endpoint_change_count").empty();
        $("#endpoint_change_count").html(`${this.fnSettings().fnRecordsTotal()}`);
        $('.recon-changes-tab-show').removeAttr('style');
      }
      else{
        $("#endpoint-changes-div").remove();
      }
      $("#endpoint-changes-loader").remove();
    },
    "oLanguage": {
      "oPaginate": { "sPrevious": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>', "sNext": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-right"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>' },
      "sInfo": "Showing page _PAGE_ of _PAGES_",
      "sSearch": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
      "sSearchPlaceholder": "Search...",
      "sLengthMenu": "Results :  _MENU_",
    },
    "processing": true,
    "dom": "<'dt--top-section'<'row'<'col-12 col-sm-6 d-flex justify-content-sm-start justify-content-center'f><'col-12 col-sm-6 d-flex justify-content-sm-end justify-content-center'l>>>" +
    "<'table-responsive'tr>" +
    "<'dt--bottom-section d-sm-flex justify-content-sm-between text-center'<'dt--pages-count  mb-sm-0 mb-3'i><'dt--pagination'p>>",
    "destroy": true,
    "stripeClasses": [],
    'serverSide': true,
    "ajax": `/api/listEndPointChanges/?scan_id=${scan_history_id}&format=datatables`,
    "order": [[ 3, "desc" ]],
    "columns": [
      {'data': 'http_url'},
      {'data': 'page_title'},
      {'data': 'http_status'},
      {'data': 'content_length'},
      {'data': 'change'},
    ],
    "bInfo": false,
    "columnDefs": [
      {"className": "text-center", "targets": [ 2 ]},
      {
        "render": function ( data, type, row ) {
          var url = split(data, 70);
          return "<a href='"+data+"' target='_blank' class='text-primary'>"+url+"</a>";
        },
        "targets": 0
      },
      {
        "render": function ( data, type, row ) {
          // display badge based on http status
          // green for http status 2XX, orange for 3XX and warning for everything else
          if (data >= 200 && data < 300) {
            return "<span class='badge  badge-soft-success'>"+data+"</span>";
          }
          else if (data >= 300 && data < 400) {
            return "<span class='badge  badge-soft-warning'>"+data+"</span>";
          }
          else if (data == 0){
            // datatable throws error when no data is returned
            return "";
          }
          return `<span class='badge  badge-soft-danger'>`+data+`</span>`;
        },
        "targets": 2,
      },
      {
        "render": function ( data, type, row ) {
          if (data == 'added'){
            return `<span class='badge badge-soft-success'><i class="fe-plus-circle"></i> Added</span>`;
          }
          else{
            return `<span class='badge badge-soft-danger'><i class="fe-minus-circle"></i> Removed</span>`;
          }
        },
        "targets": 4,
      },
    ],
  });
}

function get_ips(scan_id){
  $.getJSON(`/api/queryIps/?scan_id=${scan_id}&format=json`, function(data) {
    $('#ip-address-count').empty();
    for (var val in data['ips']){
      ip = data['ips'][val]
      badge_color = ip['is_cdn'] ? 'warning' : 'primary';
      $("#ip-address").append(`<span class='badge badge-soft-${badge_color}  m-1 badge-link' data-toggle="tooltip" title="${ip['ports'].length} Ports Open." onclick="get_ip_details('${ip['address']}', ${scan_id})">${ip['address']}</span>`);
      // $("#ip-address").append(`<span class='badge badge-soft-${badge_color}  m-1' data-toggle="modal" data-target="#tabsModal">${ip['address']}</span>`);
    }
    $('#ip-address-count').html(`<span class="badge badge-soft-primary me-1">${data['ips'].length}</span>`);
    $("body").tooltip({ selector: '[data-toggle=tooltip]' });
  });
}

function get_ip_details(ip_address, scan_id){
  if (scan_id) {
    port_url =  `/api/queryPorts/?scan_id=${scan_id}&ip_address=${ip_address}&format=json`
    subdomain_url = `/api/querySubdomains/?scan_id=${scan_id}&ip_address=${ip_address}&format=json`
  }
  else {
    port_url =  `/api/queryPorts/?&ip_address=${ip_address}&format=json`
    subdomain_url = `/api/querySubdomains/?&ip_address=${ip_address}&format=json`
  }
  var interesting_badge = `<span class="m-1 badge  badge-soft-danger bs-tooltip" title="Interesting Subdomain">Interesting</span>`;

  var port_loader = `<span class="inner-div spinner-border text-primary align-self-center loader-sm" id="port-modal-loader"></span>`;
  var subdomain_loader = `<span class="inner-div spinner-border text-primary align-self-center loader-sm" id="subdomain-modal-loader"></span>`;

  // add tab modal title
  $('#modal_title').html('Details for IP: <b>' + ip_address + '</b>');

  $('#modal-content').empty();
  $('#modal-tabs').empty();

  $('#modal-content').append(`<ul class='nav nav-tabs nav-bordered' id="modal_tab_nav"></ul><div id="modal_tab_content" class="tab-content"></div>`);

  $('#modal_tab_nav').append(`<li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#modal_content_port" aria-expanded="true"><span id="modal-open-ports-count"></span>Open Ports &nbsp;${port_loader}</a></li>`);
  $('#modal_tab_nav').append(`<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#modal_content_subdomain" aria-expanded="false"><span id="modal-subdomain-count"></span>Subdomains &nbsp;${subdomain_loader}</a></li>`)

  // add content area
  $('#modal_tab_content').empty();
  $('#modal_tab_content').append(`<div class="tab-pane show active" id="modal_content_port"></div><div class="tab-pane" id="modal_content_subdomain"></div>`);

  $('#modal-open-ports').append(`<div class="modal-text" id="modal-text-open-port"></div>`);
  $('#modal-text-open-port').append(`<ul id="modal-open-port-text"></ul>`);

  $('#modal_content_port').append(`<ul id="modal_port_ul"></ul>`);
  $('#modal_content_subdomain').append(`<ul id="modal_subdomain_ul"></ul>`);

  $.getJSON(port_url, function(data) {
    $('#modal_content_port').empty();
    $('#modal_content_port').append(`<p> IP Addresses ${ip_address} has ${data['ports'].length} Open Ports`);
    $('#modal-open-ports-count').html(`<b>${data['ports'].length}</b>&nbsp;&nbsp;`);
    for (port in data['ports']){
      port_obj = data['ports'][port];
      badge_color = port_obj['is_uncommon'] ? 'danger' : 'info';
      $("#modal_content_port").append(`<li class="mt-1">${port_obj['description']} <b class="text-${badge_color}">(${port_obj['number']}/${port_obj['service_name']})</b></li>`)
    }
    $("#port-modal-loader").remove();
  });

  $('#modal_dialog').modal('show');

  // query subdomains
  $.getJSON(subdomain_url, function(data) {
    $('#modal_content_subdomain').empty();
    $('#modal_content_subdomain').append(`<p>${data['subdomains'].length} Subdomains are associated with IP ${ip_address}`);
    $('#modal-subdomain-count').html(`<b>${data['subdomains'].length}</b>&nbsp;&nbsp;`);
    for (subdomain in data['subdomains']){
      subdomain_obj = data['subdomains'][subdomain];
      badge_color = subdomain_obj['http_status'] >= 400 ? 'danger' : '';
      li_id = get_randid();
      if (subdomain_obj['http_url']) {
        $("#modal_content_subdomain").append(`<li class="mt-1" id="${li_id}"><a href='${subdomain_obj['http_url']}' target="_blank" class="text-${badge_color}">${subdomain_obj['name']}</a></li>`)
      }
      else {
        $("#modal_content_subdomain").append(`<li class="mt-1 text-${badge_color}" id="${li_id}">${subdomain_obj['name']}</li>`);
      }

      if (subdomain_obj['http_status']) {
        $("#"+li_id).append(get_http_badge(subdomain_obj['http_status']));
        $('.bs-tooltip').tooltip();
      }

      if (subdomain_obj['is_interesting']) {
        $("#"+li_id).append(interesting_badge)
      }

    }
    $("#modal-text-subdomain").append(`<span class="float-end text-danger">*Subdomains highlighted are 40X HTTP Status</span>`);
    $("#subdomain-modal-loader").remove();
  });
}

function get_port_details(port, scan_id){
  if (scan_id) {
    ip_url = `/api/queryIps/?scan_id=${scan_id}&port=${port}&format=json`;
    subdomain_url = `/api/querySubdomains/?scan_id=${scan_id}&port=${port}&format=json`;
  }
  else{
    ip_url = `/api/queryIps/?&port=${port}&format=json`;
    subdomain_url = `/api/querySubdomains/?&port=${port}&format=json`;
  }
  var interesting_badge = `<span class="m-1 badge  badge-soft-danger bs-tooltip" title="Interesting Subdomain">Interesting</span>`;
  var ip_spinner = `<span class="spinner-border spinner-border-sm me-1" id="ip-modal-loader"></span>`;
  var subdomain_spinner = `<span class="spinner-border spinner-border-sm me-1" id="subdomain-modal-loader"></span>`;

  $('#modal_title').html('Details for Port: <b>' + port + '</b>');

  $('#modal-content').empty();
  $('#modal-tabs').empty();


  $('#modal-content').append(`<ul class='nav nav-tabs nav-bordered' id="modal_tab_nav"></ul><div id="modal_tab_content" class="tab-content"></div>`);

  $('#modal_tab_nav').append(`<li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#modal_content_ip" aria-expanded="true"><span id="modal-ip-count"></span>IP Address&nbsp;${ip_spinner}</a></li>`);
  $('#modal_tab_nav').append(`<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#modal_content_subdomain" aria-expanded="false"><span id="modal-subdomain-count"></span>Subdomains&nbsp;${subdomain_spinner}</a></li>`)

  // add content area
  $('#modal_tab_content').append(`<div class="tab-pane show active" id="modal_content_ip"></div><div class="tab-pane" id="modal_content_subdomain"></div>`);

  $('#modal_content_ip').append(`<ul id="modal_ip_ul"></ul>`);
  $('#modal_content_subdomain').append(`<ul id="modal_subdomain_ul"></ul>`);

  $('#modal_dialog').modal('show');

  $.getJSON(ip_url, function(data) {
    $('#modal_ip_ul').empty();
    $('#modal_ip_ul').append(`<p>${data['ips'].length} IP Addresses have Port ${port} Open`);
    $('#modal-ip-count').html(`<b>${data['ips'].length}</b>&nbsp;&nbsp;`);
    for (ip in data['ips']){
      ip_obj = data['ips'][ip];
      text_color = ip_obj['is_cdn'] ? 'warning' : '';
      $("#modal_ip_ul").append(`<li class='mt-1 text-${text_color}'>${ip_obj['address']}</li>`)
    }
    $('#modal_ip_ul').append(`<span class="float-end text-warning">*IP Address highlighted are CDN IP Address</span>`);
    $("#ip-modal-loader").remove();
  });

  // query subdomains
  $.getJSON(subdomain_url, function(data) {
    $('#modal_subdomain_ul').empty();
    $('#modal_subdomain_ul').append(`<p>${data['subdomains'].length} Subdomains have Port ${port} Open`);
    $('#modal-subdomain-count').html(`<b>${data['subdomains'].length}</b>&nbsp;&nbsp;`);
    for (subdomain in data['subdomains']){
      subdomain_obj = data['subdomains'][subdomain];
      badge_color = subdomain_obj['http_status'] >= 400 ? 'danger' : '';
      li_id = get_randid();
      if (subdomain_obj['http_url']) {
        $("#modal_subdomain_ul").append(`<li id="${li_id}" class="mt-1"><a href='${subdomain_obj['http_url']}' target="_blank" class="text-${badge_color}">${subdomain_obj['name']}</a></li>`)
      }
      else {
        $("#modal_subdomain_ul").append(`<li class="mt-1 text-${badge_color}" id="${li_id}">${subdomain_obj['name']}</li>`);
      }

      if (subdomain_obj['http_status']) {
        $("#"+li_id).append(get_http_badge(subdomain_obj['http_status']));
        $('.bs-tooltip').tooltip();
      }

      if (subdomain_obj['is_interesting']) {
        $("#"+li_id).append(interesting_badge)
      }

    }
    $("#modal_subdomain_ul").append(`<span class="float-end text-danger">*Subdomains highlighted are 40X HTTP Status</span>`);
    $("#subdomain-modal-loader").remove();
  });
}

function get_tech_details(tech, scan_id){
  if (scan_id) {
    url = `/api/querySubdomains/?scan_id=${scan_id}&tech=${tech}&format=json`
  }
  else {
    url = `/api/querySubdomains/?&tech=${tech}&format=json`
  }
  var interesting_badge = `<span class="m-1 badge  badge-soft-danger bs-tooltip" title="Interesting Subdomain">Interesting</span>`;
  // render tab modal
  $('.modal-title').html('Details for Technology: <b>' + tech + '</b>');
  $('#modal_dialog').modal('show');

  $('.modal-text').empty();
  $('#modal-footer').empty();
  $('.modal-text').append(`<div class='outer-div' id="modal-loader"><span class="inner-div spinner-border text-primary align-self-center loader-sm"></span></div>`);
  // query subdomains
  $.getJSON(url, function(data) {
    $('#modal-loader').empty();
    $('#modal-content').empty();
    $('#modal-content').append(`${data['subdomains'].length} Subdomains are using ${tech}`);
    for (subdomain in data['subdomains']){
      subdomain_obj = data['subdomains'][subdomain];
      badge_color = subdomain_obj['http_status'] >= 400 ? 'danger' : '';
      li_id = get_randid();
      if (subdomain_obj['http_url']) {
        $("#modal-content").append(`<li id="${li_id}"><a href='${subdomain_obj['http_url']}' target="_blank" class="text-${badge_color}">${subdomain_obj['name']}</a></li>`)
      }
      else {
        $("#modal-content").append(`<li class="text-${badge_color}" id="${li_id}">${subdomain_obj['name']}</li>`);
      }

      if (subdomain_obj['http_status']) {
        $("#"+li_id).append(get_http_badge(subdomain_obj['http_status']));
        $('.bs-tooltip').tooltip();
      }

      if (subdomain_obj['is_interesting']) {
        $("#"+li_id).append(interesting_badge)
      }

    }
    $("#modal-content").append(`<span class="float-end text-danger">*Subdomains highlighted are 40X HTTP Status</span>`);
    $("#subdomain-modal-loader").remove();
  }).fail(function(){
    $('#modal-loader').empty();
  });
}

function get_technologies(scan_id){
  $.getJSON(`/api/queryTechnologies/?scan_id=${scan_id}&format=json`, function(data) {
    $('#technologies-count').empty();
    for (var val in data['technologies']){
      tech = data['technologies'][val]
      $("#technologies").append(`<span class='badge badge-soft-primary  m-1 badge-link' data-toggle="tooltip" title="${tech['count']} Subdomains use this technology." onclick="get_tech_details('${tech['name']}', ${scan_id})">${tech['name']}</span>`);
    }
    $('#technologies-count').html(`<span class="badge badge-soft-primary me-1">${data['technologies'].length}</span>`);
    $("body").tooltip({ selector: '[data-toggle=tooltip]' });
  });
}

function get_osint_users(scan_id){
  $.getJSON(`/api/queryOsintUsers/?scan_id=${scan_id}&format=json`, function(data) {
    $('#osint-users-count').empty();
    for (var val in data['users']){
      user = data['users'][val]
      $("#osint-users").append(`<span class='badge badge-soft-info  m-1'>${user['author']}</span>`);
    }
    $('#osint-users-count').html(`<span class="badge badge-soft-primary">${data['users'].length}</span>`);
    $("body").tooltip({ selector: '[data-toggle=tooltip]' });
  }).fail(function(){
    $('#osint-users-count').empty();
    $("#osint-users").append(`<p>No Users discovered.</p>`);
  });
}

function get_ports(scan_id){
  url = `/api/queryPorts/?scan_id=${scan_id}&format=json`;
  $.getJSON(url, function(data) {
    $('#ports-count').empty();
    for (var val in data['ports']){
      port = data['ports'][val]
      badge_color = port['is_uncommon'] ? 'danger' : 'primary';
      $("#ports").append(`<span class='badge badge-soft-${badge_color}  m-1 badge-link' data-toggle="tooltip" title="${port['description']}" onclick="get_port_details('${port['number']}', ${scan_id})">${port['number']}/${port['service_name']}</span>`);
    }
    $('#ports-count').html(`<span class="badge badge-soft-primary me-1">${data['ports'].length}</span>`);
    $("body").tooltip({ selector: '[data-toggle=tooltip]' });
  });
}

function get_screenshot(scan_id){
  var port_array = [];
  var service_array = [];
  var tech_array = [];
  var ip_array = [];
  var gridzyElement = document.querySelector('.gridzy');
  gridzyElement.classList.add('gridzySkinBlank');
  gridzyElement.setAttribute('data-gridzy-layout', 'waterfall');
  gridzyElement.setAttribute('data-gridzy-spaceBetween', 10);
  gridzyElement.setAttribute('data-gridzy-desiredwidth', 350);
  gridzyElement.setAttribute('data-gridzySearchField', "#screenshot-search");
  var interesting_badge = `<span class="m-1 float-end badge  badge-soft-danger">Interesting</span>`;
  $.getJSON(`/api/listSubdomains/?scan_id=${scan_id}&no_page&only_screenshot`, function(data) {
    $("#screenshot-loader").remove();
    $("#filter-screenshot").show();
    for (var subdomain in data) {
      var figure = document.createElement('figure');
      var link = document.createElement('a');
      // return `<a href="/media/`+data+`" data-lightbox="screenshots" data-title="&lt;a target='_blank' href='`+row['http_url']+`'&gt;&lt;h3 style=&quot;color:white&quot;&gt;`+row['name']+`&lt;/h3&gt;&lt;/a&gt;"><img src="/media/`+data+`" class="img-fluid rounded mb-4 mt-4 screenshot" onerror="removeImageElement(this)"></a>`;
      // currently lookup is supported only for http_status, page title & subdomain name,
      interesting_field = data[subdomain]['is_interesting'] ? 'interesting' : '';
      var ips = data[subdomain]['ip_addresses'];
      var ip_search_values = '';
      for(var ip in ips){
        ip_address = ips[ip]['address'];
        ip_search_values += ip_address + ' ';
      }
      search_field = `${data[subdomain]['page_title']} ${data[subdomain]['name']} ${data[subdomain]['http_status']} ${ip_search_values} ${interesting_field}`;
      link.setAttribute('data-lightbox', 'screenshot-gallery')
      link.setAttribute('href', '/media/' + data[subdomain]['screenshot_path'])
      link.setAttribute('data-title', `<a target='_blank' href='`+data[subdomain]['http_url']+`'><h3 style="color:white">`+data[subdomain]['name']+`</h3></a>`);
      link.classList.add('img-fluid');
      link.classList.add('rounded');
      link.classList.add('screenshot-gallery');
      link.classList.add('mb-4');
      link.classList.add('mt-4');
      link.setAttribute('data-gridzySearchText', search_field);
      var newImage = document.createElement('img');
      newImage.setAttribute('data-gridzylazysrc', '/media/' + data[subdomain]['screenshot_path']);
      // newImage.setAttribute('data-gridzylazysrc', 'https://placeimg.com/1440/900/any?' + subdomain);
      newImage.setAttribute('height', 500);
      newImage.setAttribute('width', 500);
      newImage.setAttribute('class', 'gridzyImage');
      var figcaption = document.createElement('figcaption');
      figcaption.setAttribute('class', 'gridzyCaption');
      http_status_badge = 'danger';
      if (data[subdomain]['http_status'] >=200 && data[subdomain]['http_status'] < 300){
        http_status_badge = 'success';
      }
      else if (data[subdomain]['http_status'] >=300 && data[subdomain]['http_status'] < 400){
        http_status_badge = 'warning';
      }
      page_title = data[subdomain]['page_title'] ? data[subdomain]['page_title'] + '</br>': '' ;
      subdomain_link = data[subdomain]['http_url'] ? `<a href="${data[subdomain]['http_url']}" target="_blank">${data[subdomain]['name']}</a>` : `<a href="https://${data[subdomain]['name']}" target="_blank">${data[subdomain]['name']}</a>`
      http_status = data[subdomain]['http_status'] ? `<span class="m-1 float-end badge  badge-soft-${http_status_badge}">${data[subdomain]['http_status']}</span>` : '';
      figcaption.innerHTML = data[subdomain]['is_interesting'] ? page_title + subdomain_link + interesting_badge + http_status : page_title + subdomain_link + http_status;
      figure.appendChild(figcaption);
      link.appendChild(newImage);
      link.appendChild(figure);
      gridzyElement.appendChild(link);

      // add http status to filter values
      filter_values = 'http_' + data[subdomain]['http_status'] + ' ';

      // dynamic filtering menu
      http_status = data[subdomain]['http_status'];
      http_status_select = document.getElementById('http_select_filter');
      if(!$('#http_select_filter').find("option:contains('" + http_status + "')").length){
        var option = document.createElement('option');
        option.value = ".http_" + http_status;
        option.innerHTML = http_status;
        http_status_select.appendChild(option);
      }

      // ip, port and services filtering
      ips = data[subdomain]['ip_addresses']
      for(var ip in ips){
        ip_address = ips[ip]['address'];
        filter_values += 'ip_' + ip_address.replace(/\./g,"_") + ' ';
        if (ip_array.indexOf(ip_address) === -1){
          ip_array.push(ip_address);
        }

        ports = ips[ip]['ports'];
        for(var port in ports){
          port_number = ips[ip]['ports'][port]['number'];
          service_name = ips[ip]['ports'][port]['service_name'];

          filter_values += 'port_' + port_number + ' ';
          if (port_array.indexOf(port_number) === -1){
            port_array.push(port_number);
          }

          filter_values += 'service_' + service_name + ' ';
          if (service_array.indexOf(service_name) === -1){
            service_array.push(service_name);
          }
        }
      }

      // technology stack filtering
      technology = data[subdomain]['technologies'];
      for(var tech in technology){
        tech_name = technology[tech]['name']
        filter_values += 'tech_' + tech_name.replace(/ /g,"_").toLowerCase() + ' ';
        if (tech_array.indexOf(tech_name) === -1){
          tech_array.push(tech_name);
        }

      }

      link.setAttribute('class', filter_values);
    }

    // add port and service and tech to options
    port_select = document.getElementById('ports_select_filter');
    if (port_select) {
      port_array.sort((a, b) => a - b);
      for(var port in port_array){
        if(!$('#ports_select_filter').find("option:contains('" + port_array[port] + "')").length){
          var option = document.createElement('option');
          option.value = ".port_" + port_array[port];
          option.innerHTML = port_array[port];
          port_select.appendChild(option);
        }
      }
    }

    // add ip to select
    ip_select = document.getElementById('ips_select_filter');
    for(var ip in ip_array){
      if(!$('#ips_select_filter').find("option:contains('" + ip_array[ip] + "')").length){
        var option = document.createElement('option');
        option.value = ".ip_" + ip_array[ip];
        option.innerHTML = ip_array[ip];
        ip_select.appendChild(option);
      }
    }

    service_array.sort();
    service_select = document.getElementById('services_select_filter');
    if (service_select) {
      for(var service in service_array){
        if(!$('#services_select_filter').find("option:contains('" + service_array[service] + "')").length){
          var option = document.createElement('option');
          option.value = ".service_" + service_array[service];
          option.innerHTML = service_array[service];
          service_select.appendChild(option);
        }
      }
    }

    tech_select = document.getElementById('tech_select_filter');
    for(var tech in tech_array){
      if(!$('#tech_select_filter').find("option:contains('" + tech_array[tech] + "')").length){
        var option = document.createElement('option');
        option.value = ".tech_" + tech_array[tech].replace(/ /g,"_").toLowerCase();
        option.innerHTML = tech_array[tech];
        tech_select.appendChild(option);
      }
    }

    $(".tagging").select2({
      tags: true
    });
    // search functionality
    var gridzyElements = document.querySelectorAll('.gridzySkinBlank[data-gridzySearchField]'),
    pos = gridzyElements.length;

    while (pos--) {
      (function(gridzyElement) {
        var searchField = document.querySelector(gridzyElement.getAttribute('data-gridzySearchField'));
        var gridzyInstance = gridzyElement.gridzy;
        var gridzyItems = gridzyElement.children;

        if (searchField) {
          searchField.addEventListener('input', search);
        }

        function search() {
          var pos = gridzyItems.length,
          child,
          itemContent,
          found = false,
          searchValue = searchField.value.toLowerCase();

          if (searchValue) {
            while (pos--) {
              child = gridzyItems[pos];
              itemContent = (child.getAttribute('data-gridzySearchText') || child.innerText).toLowerCase();
              found = -1 < itemContent.search(searchValue);
              child.classList[found ? 'add' : 'remove']('searchResult');
            }
            if (gridzyInstance.getOption('filter') !== '.searchResult') {
              gridzyInstance.setOptions({filter:'.searchResult'});
            }
          } else {
            while (pos--) {
              gridzyItems[pos].classList.remove('searchResult');
            }
            if (gridzyInstance.getOption('filter') !== Gridzy.getDefaultOption('filter')) {
              gridzyInstance.setOptions({filter:null});
            }
          }
        }
      })(gridzyElements[pos]);
    }

    //filter functionality
    var gridzyInstance = document.querySelector('.gridzySkinBlank').gridzy;
    $('#http_select_filter, #ips_select_filter, #services_select_filter, #ports_select_filter, #tech_select_filter').on('change', function() {
      values = $(this).val();
      console.log(values);
      if(values.length && this.id == 'ips_select_filter'){
        var replaces_str = values.map(function(values){return values.replace(/(?<=\..*)\./g, '_');});
        console.log(replaces_str);
        gridzyInstance.setOptions({
          filter: replaces_str
        });
      }
      else if(values.length && this.id != 'ips_select_filter'){
        gridzyInstance.setOptions({
          filter: values
        });
      }
      else{
        gridzyInstance.setOptions({
          filter: '*'
        });
      }
    });
  });
}

function get_metadata(scan_id){
  // populate categories
  $.getJSON(`/api/queryDorkTypes/?scan_id=${scan_id}&format=json`, function(data) {
    for (var val in data['dorks']){
      dork = data['dorks'][val]
      $("#osint-categories-badge").append(`<span class='badge badge-soft-info  ml-1 mr-1' data-toggle="tooltip" title="${dork['count']} Results found in this dork category." onclick="get_dork_details('${dork['type']}', ${scan_id})">${dork['type']}</span>`);
    }
    $("body").tooltip({ selector: '[data-toggle=tooltip]' });
  });

  // populate detail table
  $.getJSON(`/api/queryMetadata/?scan_id=${scan_id}&format=json`, function(data) {
    $('#metadata-count').empty();
    $('#metadata-table-body').empty();
    for (var val in data['metadata']){
      doc = data['metadata'][val];
      rand_id = get_randid();
      $('#metadata-table-body').append(`<tr id=${rand_id}></tr>`);
      if (doc['doc_name']) {
        file_name = `<a href=${doc['url']} target="_blank" class="text-primary">${truncate(doc['doc_name'], 30)}</a>`;
      }
      else{
        file_name = ''
      }
      subdomain = `<span class='text-muted bs-tooltip' title='Subdomain'>${doc['subdomain']['name']}</span>`;
      $(`#${rand_id}`).append(`<td class="td-content">${file_name}</br>${subdomain}</td>`);
      if (doc['author']){
        $(`#${rand_id}`).append(`<td class="td-content text-center">${doc['author']}</td>`);
      }
      else{
        $(`#${rand_id}`).append('<td></td>')
      }
      if (doc['producer'] || doc['creator'] || doc['os']) {
        metadata = ''
        metadata += doc['producer'] ? 'Software: ' + doc['producer'] : ''
        metadata += doc['creator'] ? '/' + doc['creator'] : ''
        metadata += doc['os'] ? `<br> <span class='badge badge-soft-danger'> OS: ` + doc['os'] + '</span>': ''
        $(`#${rand_id}`).append(`<td class="td-content">${metadata}</td>`);
      }
      else{
        $(`#${rand_id}`).append('<td></td>')
      }
    }
    $('#metadata-count').html(`<span class="badge badge-soft-primary">${data['metadata'].length}</span>`);
    $('.bs-tooltip').tooltip();
  });
}


function get_emails(scan_id){
  var exposed_count = 0;
  $.getJSON(`/api/queryEmails/?scan_id=${scan_id}&format=json`, function(data) {
    $('#emails-count').empty();
    $('#email-table-body').empty();
    for (var val in data['emails']){
      email = data['emails'][val];
      rand_id = get_randid();
      $('#email-table-body').append(`<tr id=${rand_id}></tr>`);
      $(`#${rand_id}`).append(`<td class="td-content">${email['address']}</td>`);
      if (email['password']) {
        $(`#${rand_id}`).append(`<td class="td-content"><span class="badge badge-soft-danger">${email['password']}</span></td>`);
        exposed_count++;
      }
    }
    $('#emails-count').html(`<span class="badge badge-soft-primary">${data['emails'].length}</span>`);
    if (exposed_count > 0 ) {
      $('#exposed_summary').html(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-triangle"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> <span class="badge badge-soft-danger">${exposed_count}</span> Exposed Credentials`);
    }
  });
}


function get_employees(scan_id){
  $.getJSON(`/api/queryEmployees/?scan_id=${scan_id}&format=json`, function(data) {
    $('#employees-count').empty();
    $('#employees-table-body').empty();
    for (var val in data['employees']){
      emp = data['employees'][val];
      rand_id = get_randid();
      $('#employees-table-body').append(`<tr id=${rand_id}></tr>`);
      $(`#${rand_id}`).append(`<td class="td-content">${emp['name']}</td>`);
      $(`#${rand_id}`).append(`<td class="td-content">${emp['designation']}</td>`);
    }
    $('#employees-count').html(`<span class="badge badge-soft-primary">${data['employees'].length}</span>`);
  });
}


function get_dorks(scan_id){
  $.getJSON(`/api/queryDorks/?scan_id=${scan_id}&format=json`, function(data) {
    $('#dorks-count').empty();
    $('#dorks-table-body').empty();
    for (var val in data['dorks']){
      dork = data['dorks'][val];
      rand_id = get_randid();
      $('#dorks-table-body').append(`<tr id=${rand_id}></tr>`);
      $(`#${rand_id}`).append(`<td class="td-content text-center">${dork['type']}</td>`);
      $(`#${rand_id}`).append(`<td class="td-content">${truncate(dork['description'], 120)}</td>`);
      $(`#${rand_id}`).append(`<td class="td-content"><a href="${dork['url']}" target="_blank" class="text-primary">${truncate(dork['url'], 60)}</a></td>`);
    }
    $('#dorks-count').html(`<span class="badge badge-soft-primary">${data['dorks'].length}</span>`);
  });
}


function get_dork_summary(scan_id){
  $.getJSON(`/api/queryDorkTypes/?scan_id=${scan_id}&format=json`, function(data) {
    $('#dork-category-count').empty();
    for (var val in data['dorks']){
      dork = data['dorks'][val]
      $("#osint-dork").append(`<span class='badge badge-soft-info  m-1' data-toggle="tooltip" title="${dork['count']} Results found in this dork category." onclick="get_dork_details('${dork['type']}', ${scan_id})">${dork['type']}</span>`);
    }
    $('#dork-category-count').html(`<span class="badge badge-soft-primary">${data['dorks'].length}</span>`);
    $("body").tooltip({ selector: '[data-toggle=tooltip]' });
  });
}


function get_dork_details(dork_type, scan_id){
  // render tab modal
  $('.modal-title').html('Dorking Results in category: <b>' + dork_type + '</b>');
  $('#modal_dialog').modal('show');
  $('.modal-text').empty(); $('#modal-footer').empty();
  $('.modal-text').append(`<div class='outer-div' id="modal-loader"><span class="inner-div spinner-border text-primary align-self-center loader-sm"></span></div>`);
  $.getJSON(`/api/queryDorks/?scan_id=${scan_id}&type=${dork_type}&format=json`, function(data) {
    $('#modal-loader').empty();
    $('#modal-content').append(`<b>${data['dorks'].length} results found in this dork category.</b>`);
    $('#modal-content').append(`<ul id="dork-detail-modal-ul"></ul>`);
    for (dork in data['dorks']){
      dork_obj = data['dorks'][dork];
      $("#dork-detail-modal-ul").append(`<li><a href="${dork_obj['url']}" target="_blank" class="text-primary">${dork_obj['description']}</a></li>`);
    }
  });
}


function get_vulnerability_modal(scan_id, severity, subdomain_name){
  if (scan_id) {
    url = `/api/queryVulnerabilities/?scan_id=${scan_id}&severity=${severity}&subdomain_name=${subdomain_name}&format=json`;
  }
  else{
    url = `/api/queryVulnerabilities/?severity=${severity}&subdomain_name=${subdomain_name}&format=json`;
  }
  switch (severity) {
    case 0:
    severity_title = 'Informational'
    break;
    case 1:
    severity_title = 'Low'
    break;
    case 2:
    severity_title = 'Medium'
    break;
    case 3:
    severity_title = 'High'
    break;
    case 4:
    severity_title = 'Critical'
    break;
    default:
    severity_title = ''
  }
  $('.modal-title').html(`<b>${severity_title} Severity</b> Vulnerabilities`);
  $('#modal_dialog').modal('show');
  $('.modal-text').empty(); $('#modal-footer').empty();
  $('.modal-text').append(`<div class='outer-div' id="modal-loader"><span class="inner-div spinner-border text-primary align-self-center loader-sm"></span></div>`);
  $.getJSON(url, function(data) {
    $('#modal-loader').empty();
    $('#modal-content').append(`<h6>${data['vulnerabilities'].length} vulnerabilities found in subdomain <span class='text-primary'>${subdomain_name}</span>.</h6>`);
    $('#modal-content').append(`<ul id="vulnerabilities-detail-modal-ul"></ul>`);
    for (vuln in data['vulnerabilities']){
      vuln_obj = data['vulnerabilities'][vuln];
      description = '';
      reference = '';
      extracted_results = '';
      if (vuln_obj['description']) {
        description = `<br><span class="ml-2">${vuln_obj['description']}</span>`;
      }
      if (vuln_obj['reference']) {
        reference = `<br><span class="ml-2"><span class="text-dark">Reference:</span> ${vuln_obj['reference']}</span>`;
      }
      if (vuln_obj['extracted_results']) {
        extracted_results = `<br><span class="ml-2"><span class="text-dark">Extracted Results:</span> ${vuln_obj['extracted_results']}</span>`;
      }
      $("#vulnerabilities-detail-modal-ul").append(`<li><a href="${vuln_obj['http_url']}" target="_blank" class="text-primary">${vuln_obj['name']}</a>${description}${reference}${extracted_results}</li>`);
    }
  }).fail(function(){
    $('#modal-loader').empty();
    $("#modal-content").append(`<p class='text-danger'>Error loading Vulnerabilities Summary</p>`);
  });
}


function get_endpoint_modal(scan_id, subdomain_name){
  if (scan_id) {
    url = `/api/queryEndpoints/?scan_id=${scan_id}&subdomain_name=${subdomain_name}&format=json`
  }
  else{
    url = `/api/queryEndpoints/?subdomain_name=${subdomain_name}&format=json`
  }
  $('.modal-title').html(`<b>Endpoints Summary</b>`);
  $('#modal_dialog').modal('show');
  $('.modal-text').empty(); $('#modal-footer').empty();
  $('.modal-text').append(`<div class='outer-div' id="modal-loader"><span class="inner-div spinner-border text-primary align-self-center loader-sm"></span></div>`);
  $.getJSON(url, function(data) {
    $('#modal-loader').empty();
    $('#modal-content').append(`<h6>${data['endpoints'].length} endpoints discovered in subdomain <span class='text-primary'>${subdomain_name}</span>.</h6>`);
    $('#modal-content').append(`<ul id="endpoints-detail-modal-ul"></ul>`);
    for (endpoint in data['endpoints']){
      endpoint_obj = data['endpoints'][endpoint];
      if (endpoint_obj['page_title']) {
        http_url = `<br><a class="ml-2 text-dark" href="${endpoint_obj['http_url']}" target="_blank">${endpoint_obj['http_url']}</a>`
        main_title = endpoint_obj['page_title'] + http_url;
      }
      else {
        main_title = endpoint_obj['http_url']
      }
      $("#endpoints-detail-modal-ul").append(`<li><a href="${endpoint_obj['http_url']}" target="_blank" class="text-primary">${main_title}</a></li>`);
    }
  }).fail(function(){
    $('#modal-loader').empty();
    $("#modal-content").append(`<p class='text-danger'>Error loading Vulnerabilities Summary</p>`);
  });
}


function get_http_badge(http_status){
  switch (true) {
    case (http_status >= 400):
    badge_color = 'danger'
    break;
    case (http_status >= 300):
    badge_color = 'warning'
    break;
    case (http_status >= 200):
    badge_color = 'success'
    break;
    default:
    badge_color = 'danger'
  }
  if (http_status) {
    badge = `<span class="badge badge-soft-${badge_color} me-1 ms-1 bs-tooltip" data-placement="top" title="HTTP Status">${http_status}</span>`;
    return badge
  }
}

function add_todo_for_scanhistory_modal(scan_history_id){
  $("#todoTitle").val('');
  $("#todoDescription").val('');

  $('#addTaskModal').modal('show');
  subdomain_dropdown = document.getElementById('todoSubdomainDropdown');
  $.getJSON(`/api/querySubdomains?scan_id=${scan_history_id}&no_lookup_interesting&format=json`, function(data) {
    document.querySelector("#selectedSubdomainCount").innerHTML = data['subdomains'].length + ' Subdomains';
    for (var subdomain in data['subdomains']){
      subdomain_obj = data['subdomains'][subdomain];
      var option = document.createElement('option');
      option.value = subdomain_obj['id'];
      option.innerHTML = subdomain_obj['name'];
      subdomain_dropdown.appendChild(option);
    }
  });
}

// listen to save todo event

$(".add-scan-history-todo").click(function(){
  var title = document.getElementById('todoTitle').value;

  var description = document.getElementById('todoDescription').value;

  data = {
    'title': title,
    'description': description
  }

  scan_id = parseInt(document.getElementById('summary_identifier_val').value);
  data['scan_history'] = scan_id;

  if ($("#todoSubdomainDropdown").val() != 'Choose Subdomain...') {
    data['subdomain'] = parseInt($("#todoSubdomainDropdown").val());
  }

  fetch('../../recon_note/add_note', {
    method: 'post',
    headers: {
      "X-CSRFToken": getCookie("csrftoken")
    },
    body: JSON.stringify(data)
  }).then(res => res.json())
  .then(function (response) {
    Snackbar.show({
      text: 'Todo Added.',
      pos: 'top-right',
      duration: 1500,
    });
    $('#addTaskModal').modal('hide');
    get_recon_notes(null, scan_id);
  });
});


function add_task_for_subdomain(subdomain_id, subdomain_name){
  $('#todo-modal-subdomain-name').html(subdomain_name);
  $("#subdomainTodoTitle").val('');
  $("#subdomainTodoDescription").val('');

  $('#add-todo-subdomain-submit-button').attr('onClick', `add_task_for_subdomain_handler(${subdomain_id});`);


  $('#addSubdomainTaskModal').modal('show');

}


function add_task_for_subdomain_handler(subdomain_id){
  var title = document.getElementById('subdomainTodoTitle').value;
  var description = document.getElementById('subdomainTodoDescription').value;

  data = {
    'title': title,
    'description': description
  }

  scan_id = 0;
  if (document.getElementById("summary_identifier_val")) {
    scan_id = parseInt(document.getElementById('summary_identifier_val').value);
  }

  data['scan_history'] = scan_id;
  data['subdomain'] = subdomain_id;

  fetch('../../recon_note/add_note', {
    method: 'post',
    headers: {
      "X-CSRFToken": getCookie("csrftoken")
    },
    body: JSON.stringify(data)
  }).then(res => res.json())
  .then(function (response) {
    Snackbar.show({
      text: 'Todo Added.',
      pos: 'top-right',
      duration: 1500,
    });
    $('#subdomain_scan_results').DataTable().ajax.reload();
    $('#addSubdomainTaskModal').modal('hide');
  });

}

function download_subdomains(scan_id, domain_name){
  Swal.fire({
    title: 'Querying Subdomains...'
  });
  swal.showLoading();
  count = `<span class="modal_count"></span>`;
  if (scan_id) {
    url = `/api/querySubdomains?format=json&no_lookup_interesting&scan_id=${scan_id}`;
  }
  else{
    url = `/api/querySubdomains?format=json&no_lookup_interesting`;
  }
  if (domain_name) {
    $('.modal-title').html(count + ' Subdomains for : <b>' + domain_name + '</b>');
  }
  else{
    $('.modal-title').html(count + ' Subdomains');
  }
  $('.modal-text').empty(); $('#modal-footer').empty();
  $('.modal-text').append(`<div class='outer-div' id="modal-loader"></div>`);
  // query subdomains
  $.getJSON(url, function(data) {
    swal.close();
    if (data['subdomains'].length) {
      $('#modal_dialog').modal('show');
      $('.modal_count').html(data['subdomains'].length);
      $('#modal-content').empty();
      subdomains = '';
      $('#modal-content').append(`<textarea class="form-control clipboard copy-txt" id="all_subdomains_text_area" rows="10" spellcheck="false"></textarea>`);
      for (subdomain in data['subdomains']){
        subdomain_obj = data['subdomains'][subdomain];
        subdomains += subdomain_obj['name'] + '\n'
      }
      $('#all_subdomains_text_area').append(subdomains);
      $("#modal-footer").empty();
      $("#modal-footer").append(`<a href="javascript:download('subdomains-${domain_name}.txt', subdomains);" class="m-1 btn btn-dark copyable float-end btn-md"><i class="fe-download me-1"></i> Download Subdomains as txt</a>`);
      $("#modal-footer").append(`<a href="javascript:;" data-clipboard-action="copy" class="m-1 btn btn-primary copyable float-end btn-md" data-toggle="tooltip" data-placement="top" title="Copy Subdomains!" data-clipboard-target="#all_subdomains_text_area"><i class="fe-copy me-1"></i> Copy Subdomains</a>`);
    }
    else{
      swal.fire("No Subdomains", "Could not find any subdomains.", "warning", {
        button: "Okay",
      });
    }
  }).fail(function(){
    swal.fire("No Subdomains", "Could not find any subdomains.", "warning", {
      button: "Okay",
    });
  });
}

function download_interesting_subdomains(scan_id, domain_name){
  Swal.fire({
    title: 'Querying Interesting Subdomains...'
  });
  swal.showLoading();
  count = `<span class="modal_count"></span>`;
  if (scan_id) {
    url = `/api/listInterestingSubdomains/?scan_id=${scan_id}&format=json&only_subdomains&no_page`;
  }
  else{
    url = `/api/listInterestingSubdomains/?format=json&only_subdomains&no_page`;
  }
  if (domain_name) {
    $('.modal-title').html( count + ' Interesting Subdomains for : <b>' + domain_name + '</b>');
  }
  else{
    $('.modal-title').html( count + ' Interesting Subdomains');
  }
  $('.modal-text').empty(); $('#modal-footer').empty();
  // query subdomains
  $.getJSON(url, function(data) {
    swal.close()
    if (data.length) {
      $('#modal_dialog').modal('show');
      $('.modal_count').html(data.length);
      $('#modal-content').empty();
      subdomains = '';
      $('#modal-content').append(`<textarea class="form-control clipboard copy-txt" id="interesting_subdomains_text_area" rows="10" spellcheck="false"></textarea>`);
      for (subdomain in data){
        subdomains += data[subdomain]['name'] + '\n'
      }
      $('#interesting_subdomains_text_area').append(subdomains);
      $("#modal-footer").empty();
      $("#modal-footer").append(`<a href="javascript:download('interesting_subdomains-${domain_name}.txt', subdomains);" class="m-1 btn btn-dark copyable float-end btn-md"><i class="fe-download me-1"></i> Download Subdomains as txt</a>`);
      $("#modal-footer").append(`<a href="javascript:;" data-clipboard-action="copy" class="m-1 btn btn-primary copyable float-end btn-md" data-toggle="tooltip" data-placement="top" title="Copy Subdomains!" data-clipboard-target="#interesting_subdomains_text_area"><i class="fe-copy me-1"></i> Copy Subdomains</a>`);
    }
    else{
      swal.fire("No Interesting Subdomains", "Could not find any interesting subdomains.", "warning", {
        button: "Okay",
      });
    }

  }).fail(function(){
    swal.fire("No Interesting Subdomains", "Could not find any interesting subdomains.", "warning", {
      button: "Okay",
    });
  });
}

function download_interesting_endpoints(scan_id, domain_name){
  Swal.fire({
    title: 'Querying Interesting Endpoints...'
  });
  swal.showLoading();
  count = `<span class="modal_count"></span>`;
  if (scan_id) {
    url = `/api/listInterestingEndpoints/?scan_id=${scan_id}&format=json&no_page`;
  }
  else{
    url = `/api/listInterestingEndpoints/?format=json&no_page`;
  }
  if (domain_name) {
    $('.modal-title').html( count + ' Interesting Endpoints for : <b>' + domain_name + '</b>');
  }
  else{
    $('.modal-title').html( count + ' Interesting Endpoints');
  }
  $('.modal-text').empty(); $('#modal-footer').empty();
  // query subdomains
  $.getJSON(url, function(data) {
    swal.close();
    if (data.length) {
      $('#modal_dialog').modal('show');
      $('.modal_count').html(data.length);
      $('#modal-content').empty();
      endpoints = '';
      $('#modal-content').append(`<textarea class="form-control clipboard copy-txt" id="interesting_endpoints_text_area" rows="10" spellcheck="false"></textarea>`);
      for (endpoint in data){
        endpoints += data[endpoint]['http_url'] + '\n'
      }
      $('#interesting_endpoints_text_area').append(endpoints);
      $("#modal-footer").empty();
      $("#modal-footer").append(`<a href="javascript:download('interesting_endpoints-${domain_name}.txt', endpoints);" class="m-1 btn btn-dark copyable float-end btn-md"><i class="fe-download me-1"></i> Download Endpoints as txt</a>`);
      $("#modal-footer").append(`<a href="javascript:;" data-clipboard-action="copy" class="m-1 btn btn-primary copyable float-end btn-md" data-toggle="tooltip" data-placement="top" title="Copy Endpoints!" data-clipboard-target="#interesting_endpoints_text_area"><i class="fe-copy me-1"></i> Copy Endpoints</a>`);
    }
    else{
      swal.fire("No Interesting Endpoints", "Could not find any interesting Endpoints.", "warning", {
        button: "Okay",
      });
    }

  }).fail(function(){
    swal.fire("No Interesting Endpoints", "Could not find any interesting Endpoints.", "warning", {
      button: "Okay",
    });
  });
}


function download_important_subdomains(scan_id, domain_name){
  Swal.fire({
    title: 'Querying Interesting Subdomains...'
  });
  swal.showLoading();
  count = `<span class="modal_count"></span>`;
  if (scan_id) {
    url = `/api/querySubdomains?format=json&no_lookup_interesting&only_important&scan_id=${scan_id}`;
  }
  else{
    url = `/api/querySubdomains?format=json&no_lookup_interesting&only_important`;
  }
  if (domain_name) {
    $('.modal-title').html(count + 'Subdomains marked as important : <b>' + domain_name + '</b>');
  }
  else{
    $('.modal-title').html(count + ' Subdomains marked as important');
  }
  $('.modal-text').empty(); $('#modal-footer').empty();
  // query subdomains
  $.getJSON(url, function(data) {
    swal.close();
    if (data['subdomains'].length) {
      $('#modal_dialog').modal('show');
      $('.modal_count').html(data['subdomains'].length);
      $('#modal-content').empty();
      subdomains = '';
      $('#modal-content').append(`<textarea class="form-control clipboard copy-txt" id="all_subdomains_text_area" rows="10" spellcheck="false"></textarea>`);
      for (subdomain in data['subdomains']){
        subdomain_obj = data['subdomains'][subdomain];
        subdomains += subdomain_obj['name'] + '\n'
      }
      $('#all_subdomains_text_area').append(subdomains);
      $("#modal-footer").empty();
      $("#modal-footer").append(`<a href="javascript:download('important-subdomains-${domain_name}.txt', subdomains);" class="m-1 btn btn-primary copyable float-end btn-md"><i class="fe-download me-1"></i> Download Subdomains as txt</a>`);
      $("#modal-footer").append(`<a href="javascript:;" data-clipboard-action="copy" class="m-1 btn btn-dark copyable float-end btn-md" data-toggle="tooltip" data-placement="top" title="Copy Subdomains!" data-clipboard-target="#all_subdomains_text_area"><i class="fe-copy me-1"></i> Copy Subdomains</a>`);
    }
    else{
      swal.fire("No Important Endpoints", "No subdomains has been marked as important.", "warning", {
        button: "Okay",
      });
    }
  }).fail(function(){
    swal.fire("No Important Endpoints", "No subdomains has been marked as important.", "warning", {
      button: "Okay",
    });
  });
}

function download_endpoints(scan_id, domain_name, pattern){
  Swal.fire({
    title: 'Querying Endpoints...'
  });
  swal.showLoading();
  count = `<span class="modal_count">Loading... </span>`;
  if (scan_id) {
    url = `/api/queryEndpoints/?format=json&only_urls&scan_id=${scan_id}`;
  }
  else{
    url = `/api/queryEndpoints/?format=json&only_urls`;
  }
  if (pattern) {
    url += `&pattern=${pattern}`;
  }
  if (domain_name) {
    $('.modal-title').html( count + ' Endpoints for : <b>' + domain_name + '</b>');
  }
  else{
    $('.modal-title').html(count + ' Endpoints');
  }
  $('.modal-text').empty(); $('#modal-footer').empty();
  // query subdomains
  $.getJSON(url, function(data) {
    swal.close();
    $('#modal_dialog').modal('show');
    $('.modal_count').html(data['endpoints'].length);
    $('#modal-content').empty();
    endpoints = '';
    $('#modal-content').append(`<textarea class="form-control clipboard copy-txt" id="all_endpoints_text_area" rows="10" spellcheck="false"></textarea>`);
    for (endpoint in data['endpoints']){
      endpoint_obj = data['endpoints'][endpoint];
      endpoints += endpoint_obj['http_url'] + '\n'
    }
    $('#all_endpoints_text_area').append(endpoints);
    $("#modal-footer").empty();
    if (domain_name) {
      $("#modal-footer").append(`<a href="javascript:download('endpoints-${domain_name}.txt', endpoints);" class="m-1 btn btn-dark copyable float-end btn-md"><i class="fe-download me-1"></i> Download Endpoints as txt</a>`);
    }
    else{
      $("#modal-footer").append(`<a href="javascript:download('endpoints-all.txt', endpoints);" class="m-1 btn btn-primary copyable float-end btn-md"><i class="fe-download me-1"></i> Download Endpoints as txt</a>`);
    }
    $("#modal-footer").append(`<a href="javascript:;" data-clipboard-action="copy" class="m-1 btn btn-primary copyable float-end btn-md" data-toggle="tooltip" data-placement="top" title="Copy Subdomains!" data-clipboard-target="#all_endpoints_text_area"><i class="fe-copy me-1"></i> Copy Endpoints</a>`);
  }).fail(function(){
  });
}


function fetch_whois(domain_name){
  $('[data-toggle="tooltip"]').tooltip('hide');
  Snackbar.show({
    text: 'Fetching WHOIS...',
    pos: 'top-right',
    duration: 1500,
  });
  $("#whois_not_fetched_alert").hide();
  $("#whois_fetching_alert").show();
  fetch(`/api/tools/whois/?format=json&ip_domain=${domain_name}&save_db`, {}).then(res => res.json())
  .then(function (response) {
    $("#whois_fetching_alert").hide();
    document.getElementById('domain_age').innerHTML = response['domain']['domain_age'] + ' ' + response['domain']['date_created'];
    document.getElementById('ip_address').innerHTML = response['domain']['ip_address'];
    document.getElementById('ip_geolocation').innerHTML = response['domain']['geolocation'];

    document.getElementById('registrant_name').innerHTML = response['registrant']['name'];
    console.log(response['registrant']['organization'])
    document.getElementById('registrant_organization').innerHTML = response['registrant']['organization'] ? response['registrant']['organization'] : ' ';
    document.getElementById('registrant_address').innerHTML = response['registrant']['address'] + ' ' + response['registrant']['city'] + ' ' + response['registrant']['state'] + ' ' + response['registrant']['country'];
    document.getElementById('registrant_phone_numbers').innerHTML = response['registrant']['tel'];
    document.getElementById('registrant_fax').innerHTML = response['registrant']['fax'];

    Snackbar.show({
      text: 'Whois Fetched...',
      pos: 'top-right',
      duration: 3000
    });

    $("#whois_fetched_alert").show();

    $("#whois_fetched_alert").fadeTo(2000, 500).slideUp(1500, function(){
      $("#whois_fetched_alert").slideUp(500);
    });

  });
}


// initiate sub scan
$('#btn-initiate-subtask').on('click', function(){
  var subdomain_id = $('#subtask_subdomain_id').val();
  console.log(subdomain_id);
  $('#subscan-modal').modal('hide');
  var port_scan = $('#port_scan_subtask').is(':checked')
  var osint = $('#osint_subtask').is(':checked')
  var endpoint = $('#endpoint_subtask').is(':checked')
  var dir_fuzz = $('#dir_fuzz_subtask').is(':checked')
  var vuln_scan = $('#vuln_subtask').is(':checked')
  var data = {
    'subdomain_ids': [subdomain_id],
    'port_scan': port_scan,
    'osint': osint,
    'endpoint': endpoint,
    'dir_fuzz': dir_fuzz,
    'vuln_scan': vuln_scan,
  };
  Swal.fire({
    title: 'Initiating Subtask...',
    allowOutsideClick: false
  });
  swal.showLoading();
  fetch('/api/action/initiate/subtask/', {
    method: 'POST',
    credentials: "same-origin",
    headers: {
      "X-CSRFToken": getCookie("csrftoken"),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(function (response) {
    swal.close();
    if (response['status']) {
      Snackbar.show({
        text: 'Subtask initiated successfully!',
        pos: 'top-right',
        duration: 2500
      });
    }
    else{
      Swal.fire({
        title:  'Could not initiate subtask!',
        icon: 'fail',
      });
    }
  });
});
