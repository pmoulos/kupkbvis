<?php session_start(); ?>

<html>
<head>
	<script type="text/javascript" src="js/jquery-1.7.min.js"></script>
	<script type="text/javascript" src="js/jquery.json-2.3.min.js"></script>
</head>
<body>
	<form id="test" action="index.php" method="POST" target="_blank" enctype="multipart/form-data" style="visibility:hidden">
	  <input id="ikup_terms" name="ikup_terms"></input>
	</form>
	<script type="text/javascript">
		$(document).ready(function()
		{
			var genes = ['TGFb1','smad2','smad3','smad4','BMP7','ctgf','tgfbr1','smad7','agtr1','ace','hsa-miR-381','hsa-miR-362-3p','hsa-miR-142-3p'];
			var json = $.toJSON(genes);
			$("#ikup_terms").val(json);
			$("#test").submit();
		});
	</script>
	<?php
		# Alternative but with the form it appears to be better...
		/*$genes = array('TGFB1','SMAD2','SMAD3','SMAD4','BMP7','CTGF','TGFBR1','SMAD7','AGTR1','ACE');
		$genes = json_encode($genes);
		$q = array('ikup_terms' => $genes);
		header("Location: index.php?".http_build_query($q));*/
	?>
</body>
</html>
