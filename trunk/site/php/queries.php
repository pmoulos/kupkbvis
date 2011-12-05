<?php
# Initialize species drop-down and create the internal PHP hash array
$init_species = 'SELECT `tax_id`,`name` '.
				'FROM `species` '.
				'ORDER BY `name`';

# Convert ANY input to entrez IDs to reduce subsequent burden */
$entrez_from_symbol_1 = 'SELECT `entrez_id` '.
						'FROM `genes` '.
						'WHERE `gene_symbol` IN ';
$entrez_from_symbol_2 = ' AND `species`=';

# Intermediate query to get the datasets for subsequent use with disease and location
# and is based on the input genes and the corresponding proteins
$dataset_id_1 = 'SELECT `dataset_id` '.
				'FROM `data` INNER JOIN `genes` '.
				'ON data.entrez_gene_id=genes.entrez_id '.
				'WHERE genes.entrez_id IN ';
$dataset_id_2 = ' UNION '.
				'SELECT `dataset_id` '.
				'FROM data INNER JOIN `entrez_to_uniprot` '.
				'ON data.uniprot_id=entrez_to_uniprot.uniprot_id '.
				'WHERE entrez_to_uniprot.entrez_id IN ';

/* Fill the disease drop-down using the intermediate result */
$init_disease = 'SELECT DISTINCT `disease_0`,`disease_1` '.
				'FROM `datasets` '.
				'WHERE `experiment_id` IN ';

/* Fill the location drop-down using the intermediate result */
$init_location = 'SELECT DISTINCT `biomaterial_0`,`biomaterial_1` '.
				 'FROM `datasets` '.
				 'WHERE `experiment_id` IN ';

/* Fill the dataset drop-down using the intermediate result */
$init_dataset = 'SELECT `experiment_name`,`display_name` '.
				'FROM `dataset_descriptions` '.
				'WHERE `experiment_name` IN ';

/* Fill the GO terms drop down (category filtering will de done internally)*/
$init_go_1 = 'SELECT `go_id`,`go_term`,`category` '.
		     'FROM `entrez_to_go` '.
		     'WHERE `entrez_id` IN ';
$init_go_2 = ' GROUP BY `go_id`';

/* Fill the KEGG pathways drop down */
$init_kegg_1 = 'SELECT kegg_pathways.pathway_id,`name` '.
			   'FROM `kegg_pathways` INNER JOIN `pathway_members` '.
			   'ON kegg_pathways.pathway_id=pathway_members.pathway_id '.
			   'WHERE pathway_members.entrez_member IN ';
$init_kegg_2 = ' GROUP BY kegg_pathways.pathway_id';

/* Update location and datasets based on disease */
$update_locdata_disease_1 = 'SELECT `experiment_id`,`display_name`,`biomaterial_0`,`biomaterial_1`,`disease_0`,`disease_1` '.
							'FROM `datasets` INNER JOIN `dataset_descriptions` '.
							'ON datasets.experiment_id=dataset_descriptions.experiment_name '.
							'WHERE `disease_0`=';
$update_locdata_disease_2 =	' OR `disease_1`=';
#WHERE disease_0 LIKE '%Diabetic nephropathy%' OR disease_1 LIKE '%Diabetic nephropathy%'

/* Update disease and datasets based on location */
$update_disdata_location_1 = 'SELECT `experiment_id`,`display_name`,`biomaterial_0`,`biomaterial_1`,`disease_0,disease_1` '.
							 'FROM `datasets` INNER JOIN `dataset_descriptions` '.
							 'ON datasets.experiment_id=dataset_descriptions.experiment_name '.
							 'WHERE `biomaterial_0`='.
$update_disdata_location_2 = 'OR `biomaterial_1`=';
/*WHERE biomaterial_0 LIKE '%kidney%' OR biomaterial_1 LIKE '%kidney%'*/

/* Select the gene regulation for a selected dataset for both cases */
$regulation_1 = 'SELECT `entrez_gene_id`,`uniprot_id`,`expression_strength`,`differential_expression_analyte_control`,`ratio,pvalue`,`fdr` '.
				'FROM `data` '.
				'WHERE `dataset_id`=';
$regulation_2 = ' AND `entrez_gene_id` IN ';
$regulation_3 = ' UNION '.
				'SELECT `entrez_gene_id`,`data.uniprot_id`,`expression_strength`,`differential_expression_analyte_control`,`ratio,pvalue`,`fdr` '.
				'FROM `data` INNER JOIN `entrez_to_uniprot` '.
				'ON data.uniprot_id=entrez_to_uniprot.uniprot_id '.
				'WHERE entrez_to_uniprot.entrez_id IN ';
$regulation_4 = ' AND `dataset_id`=';
?>