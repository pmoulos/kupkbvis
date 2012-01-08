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
$init_kegg_1 = 'SELECT kegg_pathways.pathway_id,`name`,`class` '.
			   'FROM `kegg_pathways` INNER JOIN `pathway_members` '.
			   'ON kegg_pathways.pathway_id=pathway_members.pathway_id '.
			   'WHERE pathway_members.entrez_member IN ';
$init_kegg_2 = ' GROUP BY kegg_pathways.pathway_id';

/* Update location and datasets based on disease */
$update_locdata_disease_1 = 'SELECT `dataset_id`,`display_name`,`biomaterial_0`,`biomaterial_1` '.
							'FROM `data` INNER JOIN `genes` '.
							'ON data.entrez_gene_id=genes.entrez_id '.
							'INNER JOIN `datasets` '.
							'ON data.dataset_id=datasets.experiment_id '.
							'INNER JOIN `dataset_descriptions` '.
							'ON data.dataset_id=dataset_descriptions.experiment_name '.
							'WHERE genes.entrez_id IN ';
$update_locdata_disease_2_1 = ' AND (datasets.disease_0=\'';
$update_locdata_disease_2_2 = '\' OR datasets.disease_1=\'';
$update_locdata_disease_3 = '\') UNION ';
$update_locdata_disease_4 = 'SELECT `dataset_id`,`display_name`,`biomaterial_0`,`biomaterial_1` '.
							'FROM `data` INNER JOIN `entrez_to_uniprot` '.
							'ON data.uniprot_id=entrez_to_uniprot.uniprot_id '.
							'INNER JOIN `datasets` '.
							'ON data.dataset_id=datasets.experiment_id '.
							'INNER JOIN `dataset_descriptions` '.
							'ON data.dataset_id=dataset_descriptions.experiment_name '.
							'WHERE entrez_to_uniprot.entrez_id IN ';
$update_locdata_disease_5_1 = ' AND (datasets.disease_0=\'';
$update_locdata_disease_5_2 = '\' OR datasets.disease_1=\'';
$update_locdata_disease_6 = '\')';
#WHERE disease_0 LIKE '%Diabetic nephropathy%' OR disease_1 LIKE '%Diabetic nephropathy%'

/* Update disease and datasets based on location */
$update_disdata_location_1 = 'SELECT `dataset_id`,`display_name`,`disease_0`,`disease_1` '.
							'FROM `data` INNER JOIN `genes` '.
							'ON data.entrez_gene_id=genes.entrez_id '.
							'INNER JOIN `datasets` '.
							'ON data.dataset_id=datasets.experiment_id '.
							'INNER JOIN `dataset_descriptions` '.
							'ON data.dataset_id=dataset_descriptions.experiment_name '.
							'WHERE genes.entrez_id IN ';
$update_disdata_location_2_1 = ' AND (datasets.biomaterial_0=\'';
$update_disdata_location_2_2 = '\' OR datasets.biomaterial_1=\'';
$update_disdata_location_3 = '\') UNION ';
$update_disdata_location_4 = 'SELECT `dataset_id`,`display_name`,`disease_0`,`disease_1` '.
							'FROM `data` INNER JOIN `entrez_to_uniprot` '.
							'ON data.uniprot_id=entrez_to_uniprot.uniprot_id '.
							'INNER JOIN `datasets` '.
							'ON data.dataset_id=datasets.experiment_id '.
							'INNER JOIN `dataset_descriptions` '.
							'ON data.dataset_id=dataset_descriptions.experiment_name '.
							'WHERE entrez_to_uniprot.entrez_id IN ';
$update_disdata_location_5_1 = ' AND (datasets.biomaterial_0=\'';
$update_disdata_location_5_2 = '\' OR datasets.biomaterial_1=\'';
$update_disdata_location_6 = '\')';
/*WHERE biomaterial_0 LIKE '%kidney%' OR biomaterial_1 LIKE '%kidney%'*/

/* Select the gene regulation for a selected dataset for both cases */
$regulation_1 = 'SELECT `entrez_gene_id`,`uniprot_id`,`expression_strength`,`differential_expression_analyte_control`,`ratio,pvalue`,`fdr` '.
				'FROM `data` '.
				'WHERE `dataset_id`=';
$regulation_2 = ' AND `entrez_gene_id` IN ';
$regulation_3 = ' UNION '.
				'SELECT `entrez_gene_id`,data.uniprot_id,`expression_strength`,`differential_expression_analyte_control`,`ratio`,`pvalue`,`fdr` '.
				'FROM `data` INNER JOIN `entrez_to_uniprot` '.
				'ON data.uniprot_id=entrez_to_uniprot.uniprot_id '.
				'WHERE entrez_to_uniprot.entrez_id IN ';
$regulation_4 = ' AND `dataset_id`=';

/* Autocomplete gene names */
$auto_genes_1 = 'SELECT `gene_symbol`,`description`,species.name '.
				'FROM `genes` INNER JOIN `species` '.
				'ON genes.species=species.tax_id '.
				'WHERE `gene_symbol` LIKE ';
$auto_genes_2 = ' AND `species`=';

/* Find Ensembl protein from set of entrez ids */
$ensembl_from_entrez = 'SELECT DISTINCT `entrez_id`,`source` '.
					   'FROM `interactions` INNER JOIN `entrez_to_ensembl` '.
					   'ON interactions.source=entrez_to_ensembl.ensembl_protein '.
					   'WHERE entrez_to_ensembl.entrez_id IN ';

/* Find Ensembl protein from set of entrez ids and initiate nodes*/
$init_nodes = 'SELECT DISTINCT interactions.source AS id,'.
			  'genes.gene_symbol AS label,'.
			  'entrez_to_ensembl.entrez_id AS entrez_id '.
			  'FROM interactions INNER JOIN entrez_to_ensembl '.
			  'ON interactions.source=entrez_to_ensembl.ensembl_protein '.
			  'INNER JOIN genes '.
			  'ON entrez_to_ensembl.entrez_id=genes.entrez_id '.
			  'WHERE entrez_to_ensembl.entrez_id IN ';

/* Get interactions */
$init_edges_1 = 'SELECT DISTINCT CONCAT_WS("_",CONCAT_WS("_to_",`source`,`target`),`interaction`) AS `id`,'.
				'`target`, `source`, `interaction` '.
			    'FROM `interactions` '.
			    'WHERE `source` IN ';
$init_edges_2 = ' AND `target` IN ';

/* Get the selected GO terms and their genes to create GO nodes and edges */
$get_go_1 = 'SELECT CONCAT_WS("_to_",`go_id`,`ensembl_protein`) AS `edge_id`,entrez_to_go.entrez_id,`go_id`,`go_term`,`category`,`pubmed`,`ensembl_protein` '.
			'FROM `entrez_to_go` INNER JOIN `entrez_to_ensembl` '.
			'ON entrez_to_go.entrez_id=entrez_to_ensembl.entrez_id '.
			'WHERE `ensembl_protein` IN ';
$get_go_2 = ' AND `go_id` IN ';

/* Get the selected KEGG pathways and their proteins to create KEGG nodes and edges */
$get_kegg_1 = 'SELECT CONCAT_WS("_to_",pathway_members.pathway_id,`ensembl_protein`) AS `edge_id`,`entrez_member`,pathway_members.pathway_id,`name`,`class`,`ensembl_protein` '.
              'FROM `pathway_members` INNER JOIN `entrez_to_ensembl` '.
              'ON pathway_members.entrez_member=entrez_to_ensembl.entrez_id '.
              'INNER JOIN `kegg_pathways` '.
              'ON pathway_members.pathway_id=kegg_pathways.pathway_id '.
              'WHERE `ensembl_protein` IN ';
$get_kegg_2 = 'AND pathway_members.pathway_id IN ';
?>
