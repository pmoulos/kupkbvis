<?php
# Initialize species drop-down and create the internal PHP hash array
$init_species = 'SELECT `tax_id`,`name` '.
				'FROM `species` '.
				'ORDER BY `name`';

# Convert ANY input to entrez IDs to reduce subsequent burden */
$entrez_from_any_1 = 'SELECT genes.entrez_id AS `entity`,\'gene\' AS `type` '.
					 'FROM `genes` INNER JOIN `entrez_to_uniprot` '.
					 'ON genes.entrez_id=entrez_to_uniprot.entrez_id '.
					 'INNER JOIN `entrez_to_ensembl` '.
					 'ON genes.entrez_id=entrez_to_ensembl.entrez_id '.
					 'INNER JOIN `species` '.
					 'ON genes.species=species.tax_id '.
					 'WHERE (';
$entrez_from_any_2_1 = 'genes.gene_symbol IN ';
$entrez_from_any_2_2 = ' OR genes.entrez_id IN ';
$entrez_from_any_2_3 = ' OR entrez_to_uniprot.uniprot_id IN ';
$entrez_from_any_2_4 = ' OR entrez_to_ensembl.ensembl_gene IN ';
$entrez_from_any_2_5 = ' OR entrez_to_ensembl.ensembl_protein IN ';
$entrez_from_any_3 = ') AND species.tax_id=';
$entrez_from_any_4 = ' GROUP BY genes.entrez_id';
$union_mirna = ' UNION ';
$mirna_from_input_1 = 'SELECT `mirna_id` AS `entity`,\'mirna\' AS `type` '.
					  'FROM `mirna_to_ensembl` '.
					  'INNER JOIN `species` '.
					  'ON mirna_to_ensembl.species=species.tax_id '.
					  'WHERE `mirna_id` IN ';
$mirna_from_input_2 = ' AND species.tax_id=';
$mirna_from_input_3 = ' GROUP BY `mirna_id`';

$entrez_from_symbol_1 = 'SELECT `entrez_id` '.
						'FROM `genes` '.
						'WHERE `gene_symbol` IN ';
$entrez_from_symbol_2 = ' AND `species`=';

# Get gene symbols from entrez... Useful in case of neighbors being called and wanting to
# change species...
$symbol_from_entrez = 'SELECT `gene_symbol` '.
					  'FROM `genes` '.
					  'WHERE  `entrez_id` IN ';

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
$dataset_id_3 = ' UNION '.
				'SELECT `dataset_id` '.
				'FROM `data` INNER JOIN `genes` '.
				'ON data.gene_symbol=genes.gene_symbol '.
				'WHERE genes.entrez_id IN ';

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

/* Fill the miRNA drop down */
$init_mirna = 'SELECT DISTINCT `mirna_id` '.
			  'FROM `mirna_to_ensembl` INNER JOIN `entrez_to_ensembl` '.
			  'ON mirna_to_ensembl.ensembl_gene=entrez_to_ensembl.ensembl_gene '.
			  'WHERE entrez_to_ensembl.entrez_id IN ';

/* Update datasets, locations, diseases */
$update_locdisdata_1 = 'SELECT `dataset_id`,`display_name`,`disease_0`,`disease_1`,`biomaterial_0`,`biomaterial_1` '.
					   'FROM `data` INNER JOIN `genes` '.
					   'ON data.entrez_gene_id=genes.entrez_id '.
					   'INNER JOIN `datasets` '.
					   'ON data.dataset_id=datasets.experiment_id '.
					   'INNER JOIN `dataset_descriptions` '.
					   'ON data.dataset_id=dataset_descriptions.experiment_name '.
					   'WHERE genes.entrez_id IN ';
$update_locdisdata_2_1 = ' AND (datasets.disease_0 IN ';
$update_locdisdata_2_2 = ' OR datasets.disease_1 IN ';
$update_locdisdata_2_3 = ') AND (datasets.biomaterial_0 IN ';
$update_locdisdata_2_4 = ' OR datasets.biomaterial_1 IN ';
$update_locdisdata_3 = ') UNION '.
					   'SELECT `dataset_id`,`display_name`,`disease_0`,`disease_1`,`biomaterial_0`,`biomaterial_1` '.
					   'FROM `data` INNER JOIN `entrez_to_uniprot` '.
					   'ON data.uniprot_id=entrez_to_uniprot.uniprot_id '.
					   'INNER JOIN `datasets` '.
					   'ON data.dataset_id=datasets.experiment_id '.
					   'INNER JOIN `dataset_descriptions` '.
					   'ON data.dataset_id=dataset_descriptions.experiment_name '.
					   'WHERE entrez_to_uniprot.entrez_id IN ';
$update_locdisdata_4_1 = ' AND (datasets.disease_0 IN ';
$update_locdisdata_4_2 = ' OR datasets.disease_1 IN ';
$update_locdisdata_4_3 = ') AND (datasets.biomaterial_0 IN ';
$update_locdisdata_4_4 = ' OR datasets.biomaterial_1 IN ';
$update_locdisdata_5 = ') UNION '.
					   'SELECT `dataset_id`,`display_name`,`disease_0`,`disease_1`,`biomaterial_0`,`biomaterial_1` '.
					   'FROM `data` INNER JOIN `genes` '.
					   'ON data.gene_symbol=genes.gene_symbol '.
					   'INNER JOIN `datasets` '.
					   'ON data.dataset_id=datasets.experiment_id '.
					   'INNER JOIN `dataset_descriptions` '.
					   'ON data.dataset_id=dataset_descriptions.experiment_name '.
					   'WHERE genes.entrez_id IN ';
$update_locdisdata_6_1 = ' AND (datasets.disease_0 IN ';
$update_locdisdata_6_2 = ' OR datasets.disease_1 IN ';
$update_locdisdata_6_3 = ') AND (datasets.biomaterial_0 IN ';
$update_locdisdata_6_4 = ' OR datasets.biomaterial_1 IN ';
$update_locdisdata_7 = ')';

/* Select the gene regulation for a selected dataset for both cases */
$get_coloring_1 = 'SELECT datasets.record_id,`dataset_id`,`display_name`,`disease_0`,`disease_1`,`biomaterial_0`,`biomaterial_1`,`compound_list`,`entrez_gene_id`,`expression_strength`,`differential_expression_analyte_control`,`ratio`,`pvalue`,`fdr` '.
				  'FROM `data` INNER JOIN `datasets` '.
				  'ON data.dataset_record_id = datasets.record_id '.
				  'INNER JOIN `dataset_descriptions` '.
				  'ON datasets.experiment_id = dataset_descriptions.experiment_name '.
				  'WHERE `entrez_gene_id` IN ';
$get_coloring_2_1 = ' AND `dataset_id` IN ';
$get_coloring_2_2 = ' AND (datasets.disease_0 IN ';
$get_coloring_2_3 = ' OR datasets.disease_1 IN ';
$get_coloring_2_4 = ') AND (datasets.biomaterial_0 IN ';
$get_coloring_2_5 = ' OR datasets.biomaterial_1 IN ';
$get_coloring_3 = ') UNION '.
				  'SELECT datasets.record_id,`dataset_id`,`display_name`,`disease_0`,`disease_1`,`biomaterial_0`,`biomaterial_1`,`compound_list`,entrez_to_uniprot.entrez_id,`expression_strength`,`differential_expression_analyte_control`,`ratio`,`pvalue`,`fdr` '.
				  'FROM `data` INNER JOIN `datasets` '.
				  'ON data.dataset_record_id = datasets.record_id '.
				  'INNER JOIN `dataset_descriptions` '.
				  'ON datasets.experiment_id = dataset_descriptions.experiment_name '.
				  'INNER JOIN `entrez_to_uniprot` '.
				  'ON data.uniprot_id=entrez_to_uniprot.uniprot_id '.
				  'WHERE entrez_to_uniprot.entrez_id IN ';
$get_coloring_4_1 = ' AND `dataset_id` IN ';
$get_coloring_4_2 = ' AND (datasets.disease_0 IN ';
$get_coloring_4_3 = ' OR datasets.disease_1 IN ';
$get_coloring_4_4 = ') AND (datasets.biomaterial_0 IN ';
$get_coloring_4_5 = ' OR datasets.biomaterial_1 IN ';
$get_coloring_5 = ') UNION '.
				  'SELECT datasets.record_id,`dataset_id`,`display_name`,`disease_0`,`disease_1`,`biomaterial_0`,`biomaterial_1`,`compound_list`,genes.entrez_id,`expression_strength`,`differential_expression_analyte_control`,`ratio`,`pvalue`,`fdr` '.
				  'FROM `data` INNER JOIN `datasets` '.
				  'ON data.dataset_record_id = datasets.record_id '.
				  'INNER JOIN `dataset_descriptions` '.
				  'ON datasets.experiment_id = dataset_descriptions.experiment_name '.
				  'INNER JOIN `genes` '.
				  'ON data.gene_symbol=genes.gene_symbol '.
				  'WHERE genes.entrez_id IN ';
$get_coloring_6_1 = ' AND `dataset_id` IN ';
$get_coloring_6_2 = ' AND (datasets.disease_0 IN ';
$get_coloring_6_3 = ' OR datasets.disease_1 IN ';
$get_coloring_6_4 = ') AND (datasets.biomaterial_0 IN ';
$get_coloring_6_5 = ' OR datasets.biomaterial_1 IN ';
$get_coloring_7 = ')';

/* Autocomplete gene names */
$auto_genes_1 = 'SELECT `gene_symbol`,`description`,species.name '.
				'FROM `genes` INNER JOIN `species` '.
				'ON genes.species=species.tax_id '.
				'WHERE `gene_symbol` LIKE ';
$auto_genes_2 = ' AND `species`=';

$auto_genes = 'SELECT `entrez_id`,`gene_symbol`,`description`,species.name '.
			  'FROM `genes` INNER JOIN `species` '.
			  'ON genes.species=species.tax_id '.
			  'WHERE `entrez_id` IN ';
$auto_ensembl = 'SELECT entrez_to_ensembl.entrez_id,`ensembl_gene`,`ensembl_protein`,`description`,species.name '.
				'FROM `entrez_to_ensembl` INNER JOIN `genes` '.
				'ON entrez_to_ensembl.entrez_id=genes.entrez_id '.
				'INNER JOIN `species` '.
				'ON entrez_to_ensembl.species=species.tax_id '.
				'WHERE entrez_to_ensembl.id IN ';
$auto_mirna = 'SELECT DISTINCT `mirna_id`,species.name '.
			  'FROM `mirna_to_ensembl` INNER JOIN `species` '.
			  'ON mirna_to_ensembl.species=species.tax_id '.
			  'WHERE `id` IN ';
$auto_uniprot = 'SELECT entrez_to_uniprot.entrez_id,`uniprot_id`,`gene_symbol`,`description` '.
				'FROM `entrez_to_uniprot` INNER JOIN `genes` '.
				'ON entrez_to_uniprot.entrez_id=genes.entrez_id '.
				'WHERE entrez_to_uniprot.id IN ';

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
$init_edges_1 = 'SELECT DISTINCT `target`, `source`, `interaction` '.
			    'FROM `interactions` '.
			    'WHERE `source` IN ';
$init_edges_2 = ' AND `target` IN ';
$init_edges_3 = ' AND `score`>=';

/* Initiate input miRNA nodes, edges are initiated with the query of getmirnaElements */
$init_mirna_nodes = 'SELECT DISTINCT `mirna_id` '.
					'FROM `mirna_to_ensembl` '.
					'WHERE `mirna_id` IN ';

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
$get_kegg_2 = ' AND pathway_members.pathway_id IN ';

/* Get miRNA edges */
$get_mirna_1 = 'SELECT CONCAT_WS("_to_",`mirna_id`,`ensembl_protein`) AS `edge_id`,`mirna_id`,`ensembl_protein` '.
			   'FROM `mirna_to_ensembl` INNER JOIN `entrez_to_ensembl` '.
			   'ON mirna_to_ensembl.ensembl_gene=entrez_to_ensembl.ensembl_gene '.
			   'WHERE `ensembl_protein` IN ';
$get_mirna_2 = ' AND `mirna_id` IN ';

/* Get gene data to display */
$get_gene = 'SELECT `synonyms`, `dbXrefs`, `chromosome`, `description` '.
			'FROM `genes` '.
			'WHERE `entrez_id`=';

/* Get the gene symbols connected by an edge based on node ids (ensembl protein) */
$get_edge_1 = 'SELECT `gene_symbol`,`score` '.
			  'FROM `genes` INNER JOIN `entrez_to_ensembl` '.
			  'ON genes.entrez_id=entrez_to_ensembl.entrez_id '.
			  'INNER JOIN `interactions` '.
			  'WHERE (entrez_to_ensembl.ensembl_protein=';
$get_edge_2 = ' OR entrez_to_ensembl.ensembl_protein=';
$get_edge_3 = ') AND (interactions.source=';
$get_edge_4 = ' AND interactions.target=';
$get_edge_5 = ')';

/* Get the additional proteins */
$get_neighbors_1 = 'SELECT `ensembl_protein` '.
				   'FROM `entrez_to_ensembl` INNER JOIN `interactions` '.
				   'ON entrez_to_ensembl.ensembl_protein=interactions.target '.
				   'WHERE `source` IN ';
$get_neighbors_2 = ' AND `target` NOT IN ';
$get_neighbors_3 = ' AND score>=';
$get_neighbors_4 = ' GROUP BY `ensembl_protein`';

/* With the results, initilize additional nodes in cytoscapeweb */
$get_add_nodes = 'SELECT DISTINCT interactions.source AS `id`,genes.gene_symbol AS `label`,entrez_to_ensembl.entrez_id AS `entrez_id` '.
				 'FROM `interactions` INNER JOIN `entrez_to_ensembl` '.
				 'ON interactions.source=entrez_to_ensembl.ensembl_protein '.
				 'INNER JOIN `genes` '.
				 'ON entrez_to_ensembl.entrez_id=genes.entrez_id '.
				 'WHERE entrez_to_ensembl.ensembl_protein IN ';

/* Then additional edges in cytoscapeweb */
$get_add_edges_1 = 'SELECT DISTINCT `target`,`source`,`interaction` '.
				   'FROM `interactions` '.
				   'WHERE `source` IN ';
$get_add_edges_2 = ' AND `target` IN ';

/* Get datasets for miRNA interface section */
$mirna_dataset_id = 'SELECT `dataset_id` '.
					'FROM `data` '.
					'WHERE `microcosm_id` IN ';

/* Get diseases for miRNA datasets */
$init_mirna_disease = 'SELECT DISTINCT `disease_0`,`disease_1` '.
					  'FROM `datasets` '.
					  'WHERE `experiment_id` IN ';

/* Get locations for miRNA datasets */
$init_mirna_location = 'SELECT DISTINCT `biomaterial_0`,`biomaterial_1` '.
					   'FROM `datasets` '.
					   'WHERE `experiment_id` IN ';

/* Get names for miRNA datasets */
$init_mirna_dataset = 'SELECT `experiment_name`,`display_name` '.
					  'FROM `dataset_descriptions` '.
					  'WHERE `experiment_name` IN ';

$update_mirna_dislocdata_1 = 'SELECT `dataset_id`,`display_name`,`disease_0`,`disease_1`,`biomaterial_0`,`biomaterial_1` '.
						     'FROM `data` INNER JOIN `datasets` '.
						     'ON data.dataset_id=datasets.experiment_id '.
						     'INNER JOIN `dataset_descriptions` '.
						     'ON data.dataset_id=dataset_descriptions.experiment_name '.
						     'WHERE data.microcosm_id IN ';
$update_mirna_dislocdata_2_1 = ' AND (datasets.disease_0 IN ';
$update_mirna_dislocdata_2_2 = ' OR datasets.disease_1 IN ';
$update_mirna_dislocdata_2_3 = ') AND (datasets.biomaterial_0 IN ';
$update_mirna_dislocdata_2_4 = ' OR datasets.biomaterial_1 IN ';
$update_mirna_dislocdata_3 = ')';

$get_mirna_coloring_1 = 'SELECT datasets.record_id,`dataset_id`,`display_name`,`disease_0`,`disease_1`,`biomaterial_0`,`biomaterial_1`,`microcosm_id`,`expression_strength`,`differential_expression_analyte_control`,`ratio`,`pvalue`,`fdr` '.
						'FROM `data` INNER JOIN `datasets` '.
						'ON data.dataset_record_id = datasets.record_id '.
						'INNER JOIN `dataset_descriptions` '.
						'ON datasets.experiment_id = dataset_descriptions.experiment_name '.
						'WHERE `microcosm_id` IN ';
$get_mirna_coloring_2_1 = ' AND `dataset_id` IN ';
$get_mirna_coloring_2_2 = ' AND (datasets.disease_0 IN ';
$get_mirna_coloring_2_3 = ' OR datasets.disease_1 IN ';
$get_mirna_coloring_2_4 = ') AND (datasets.biomaterial_0 IN ';
$get_mirna_coloring_2_5 = ' OR datasets.biomaterial_1 IN ';
$get_mirna_coloring_3 = ')';

/* Query for dataset report */
$dataset_report = 'SELECT `display_name`,`experiment_condition_0`,`species_0`,`biomaterial_0`,`disease_0`,`severity_0`,`experiment_condition_1`,`biomaterial_1`,`disease_1`,`severity_1`,`species_1`,`experiment_assay`,`pmid`,datasets.external_link AS `external_link`,`geo_acc`,`experiment_description` '.
				  'FROM `datasets` INNER JOIN `dataset_descriptions` '.
				  'ON datasets.experiment_id=dataset_descriptions.experiment_name '.
				  'WHERE `experiment_id`=';

/* Get all KUPKB genes as Ensembl proteins to be used when calling only for KUPKB neighbors */
$allkupkb2protein_1 = 'SELECT DISTINCT `ensembl_protein` '.
					  'FROM `entrez_to_ensembl` '.
					  'WHERE `entrez_id` IN ('.
					  'SELECT genes.entrez_id '.
					  'FROM `genes` INNER JOIN `data` '.
					  'ON genes.entrez_id=data.entrez_gene_id '.
					  'WHERE data.entrez_gene_id<>\'NULL\' AND data.entrez_gene_id<>\'\' '.
					  ' AND data.dataset_id IN ';
$allkupkb2protein_2	= ' AND genes.species=';
$allkupkb2protein_3 = ' UNION '.
					  'SELECT entrez_to_uniprot.entrez_id '.
					  'FROM `entrez_to_uniprot` INNER JOIN `data` '.
					  'ON entrez_to_uniprot.uniprot_id=data.uniprot_id '.
					  'INNER JOIN `genes` '.
					  'ON entrez_to_uniprot.entrez_id=genes.entrez_id '.
					  'WHERE (data.uniprot_id<>\'NULL\' AND data.uniprot_id<>\'\') '.
					  ' AND data.dataset_id IN ';
$allkupkb2protein_4 = 'AND genes.species=';
$allkupkb2protein_5 = ')';

$allkupkbsymbols2protein = 'SELECT DISTINCT `ensembl_protein` '.
						   'FROM `entrez_to_ensembl` '.
						   'WHERE `entrez_id` IN ';

/* Speed hacks */
$allkupkb_symbols = 'SELECT DISTINCT data.gene_symbol '.
				    'FROM `data` '.
				    'WHERE data.gene_symbol<>\'NULL\' AND data.gene_symbol<>\'\'';
$allkupkb_symbols2entrez = 'SELECT `entrez_id`,`species` '.
						   'FROM `genes` '.
						   'WHERE `gene_symbol` IN ';
# LEGACY
/* Get data for coloring this is slower than the UNION below above but we are keeping it for legacy reasons */
/*$get_coloring_1 = 'SELECT `dataset_id`,`entrez_gene_id`,`uniprot_id`,`expression_strength`,`differential_expression_analyte_control`,`ratio`,`pvalue`,`fdr` '.
				  'FROM data '.
				  'WHERE (`entrez_gene_id` IN ';
$get_coloring_2 = 'OR `uniprot_id` IN ('.
				  'SELECT `uniprot_id` '.
				  'FROM `entrez_to_uniprot` '.
				  'WHERE `entrez_id` IN ';
$get_coloring_3 = ')) AND `dataset_id`=';*/

/* Update location and datasets based on disease */
/*$update_locdata_disease_1 = 'SELECT `dataset_id`,`display_name`,`biomaterial_0`,`biomaterial_1` '.
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
$update_locdata_disease_6 = '\')';*/

/* Update disease and datasets based on location */
/*$update_disdata_location_1 = 'SELECT `dataset_id`,`display_name`,`disease_0`,`disease_1` '.
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
$update_disdata_location_6 = '\')';*/
/*WHERE biomaterial_0 LIKE '%kidney%' OR biomaterial_1 LIKE '%kidney%'*/

/* Update location and datasets based on disease for miRNAs */
/*$update_mirna_locdata_disease_1 = 'SELECT `dataset_id`,`display_name`,`biomaterial_0`,`biomaterial_1` '.
								  'FROM `data` INNER JOIN `datasets` '.
								  'ON data.dataset_id=datasets.experiment_id '.
								  'INNER JOIN `dataset_descriptions` '.
								  'ON data.dataset_id=dataset_descriptions.experiment_name '.
								  'WHERE data.microcosm_id IN ';
$update_mirna_locdata_disease_2_1 = ' AND (datasets.disease_0=\'';
$update_mirna_locdata_disease_2_2 = '\' OR datasets.disease_1=\'';
$update_mirna_locdata_disease_3 = '\')';*/

/* Update disease and datasets based on location */
/*$update_mirna_disdata_location_1 = 'SELECT `dataset_id`,`display_name`,`disease_0`,`disease_1` '.
								   'FROM `data` INNER JOIN `datasets` '.
								   'ON data.dataset_id=datasets.experiment_id '.
								   'INNER JOIN `dataset_descriptions` '.
								   'ON data.dataset_id=dataset_descriptions.experiment_name '.
								   'WHERE data.microcosm_id IN ';
$update_mirna_disdata_location_2_1 = ' AND (datasets.biomaterial_0=\'';
$update_mirna_disdata_location_2_2 = '\' OR datasets.biomaterial_1=\'';
$update_mirna_disdata_location_3 = '\')';*/
?>
