<?php
# Initialize species drop-down and create the internal PHP hash array
$init_species = 'SELECT `tax_id`,`name` '.
				'FROM `species`';

# Convert ANY input to entrez IDs to reduce subsequent burden */
$entrez_from_symbol_1 = 'SELECT `entrez_id` '.
						'FROM `genes` '.
						'WHERE `gene_symbol` IN (';
$entrez_from_symbol_2 = ') AND species=';

# Intermediate query to get the datasets for subsequent use with disease and location
# and is based on the input genes and the corresponding proteins
$dataset_id_1 = 'SELECT `dataset_id` '.
				'FROM `data` INNER JOIN `genes` '.
				'ON `data.entrez_gene_id`=`genes.entrez_id` '.
				'WHERE `genes.entrez_id` IN ';
$dataset_id_2 = 'UNION '.
				'SELECT `dataset_id` '.
				'FROM data INNER JOIN `entrez_to_uniprot` '.
				'ON `data.uniprot_id`=`entrez_to_uniprot.uniprot_id` '.
				'WHERE `entrez_to_uniprot.entrez_id` IN ';

/* Fill the disease drop-down using the intermediate result */
/*SELECT DISTINCT disease_0,disease_1
FROM datasets
WHERE experiment_id IN
('doucet_garonne','sadlier_johnson_d5qpcr','sadlier_johnson_d5','song_pei_adpkdkidney','zhao_tilton_mouserenalcortex','iphone_mrna',
'hkupp_rodentimcd_db','hkupp_humanglomerulus_db','sigdel_sarwal_humanurineacuterejection','hkupp_humanurinaryexosome_db',
'rooney_crean_humankidneydiabet','gse11221_detrusor','gse11221_urothelium','gse22464','huttlin_mouse_phospho','gse1009',
'huttlin_mouse_nonphospho','gse17141','gse4816','vontoerne_nelson_ifta_14d','vontoerne_nelson_ifta_7d','vontoerne_nelson_ifta_56d',
'gse7887','gse13672_ratproxtub','gse13672_ratmtal','gse6466_neonatal','gse6466_adult','gse22561','gse17142','hills_brunskill_proxtubtgfmrna')*/

/* Fill the location drop-down using the intermediate result */
/*SELECT DISTINCT biomaterial_0,biomaterial_1
FROM datasets
WHERE experiment_id IN
('doucet_garonne','sadlier_johnson_d5qpcr','sadlier_johnson_d5','song_pei_adpkdkidney','zhao_tilton_mouserenalcortex','iphone_mrna',
'hkupp_rodentimcd_db','hkupp_humanglomerulus_db','sigdel_sarwal_humanurineacuterejection','hkupp_humanurinaryexosome_db',
'rooney_crean_humankidneydiabet','gse11221_detrusor','gse11221_urothelium','gse22464','huttlin_mouse_phospho','gse1009',
'huttlin_mouse_nonphospho','gse17141','gse4816','vontoerne_nelson_ifta_14d','vontoerne_nelson_ifta_7d','vontoerne_nelson_ifta_56d',
'gse7887','gse13672_ratproxtub','gse13672_ratmtal','gse6466_neonatal','gse6466_adult','gse22561','gse17142','hills_brunskill_proxtubtgfmrna')*/

/* Fill the dataset drop-down using the intermediate result */
/*SELECT display_name
FROM dataset_descriptions
WHERE experiment_name IN
('doucet_garonne','sadlier_johnson_d5qpcr','sadlier_johnson_d5','song_pei_adpkdkidney','zhao_tilton_mouserenalcortex','iphone_mrna',
'hkupp_rodentimcd_db','hkupp_humanglomerulus_db','sigdel_sarwal_humanurineacuterejection','hkupp_humanurinaryexosome_db',
'rooney_crean_humankidneydiabet','gse11221_detrusor','gse11221_urothelium','gse22464','huttlin_mouse_phospho','gse1009',
'huttlin_mouse_nonphospho','gse17141','gse4816','vontoerne_nelson_ifta_14d','vontoerne_nelson_ifta_7d','vontoerne_nelson_ifta_56d',
'gse7887','gse13672_ratproxtub','gse13672_ratmtal','gse6466_neonatal','gse6466_adult','gse22561','gse17142','hills_brunskill_proxtubtgfmrna')*/

/* Fill the GO terms drop down (category filtering will de done internally)*/
/*SELECT go_id,go_term,category
FROM entrez_to_go
WHERE entrez_id IN (185,655,1490,1636,4087,4088,4089,4092,7040,7046)
GROUP BY go_id*/

/* Fill the KEGG pathways drop down */
/*SELECT kegg_pathways.pathway_id,name
FROM kegg_pathways INNER JOIN pathway_members
ON kegg_pathways.pathway_id=pathway_members.pathway_id
WHERE pathway_members.entrez_member IN (185,655,1490,1636,4087,4088,4089,4092,7040,7046)
GROUP BY kegg_pathways.pathway_id*/

/* Update location and datasets based on disease */
/*SELECT experiment_id,display_name,biomaterial_0,biomaterial_1,disease_0,disease_1
FROM datasets INNER JOIN dataset_descriptions
ON datasets.experiment_id=dataset_descriptions.experiment_name
WHERE disease_0='Diabetic nephropathy' OR disease_1='Diabetic nephropathy'*/
/*WHERE disease_0 LIKE '%Diabetic nephropathy%' OR disease_1 LIKE '%Diabetic nephropathy%'*/

/* Update disease and datasets based on location */
/*SELECT experiment_id,display_name,biomaterial_0,biomaterial_1,disease_0,disease_1
FROM datasets INNER JOIN dataset_descriptions
ON datasets.experiment_id=dataset_descriptions.experiment_name
WHERE biomaterial_0='kidney' OR biomaterial_1='kidney'*/
/*WHERE biomaterial_0 LIKE '%kidney%' OR biomaterial_1 LIKE '%kidney%'*/

/* Select the gene regulation for a selected dataset for both cases */
/*SELECT entrez_gene_id,uniprot_id,expression_strength,differential_expression_analyte_control,ratio,pvalue,fdr
FROM data
WHERE dataset_id='gse1563_acuterejection'
AND entrez_gene_id IN (185,655,1490,1636,4087,4088,4089,4092,7040,7046)
UNION
SELECT entrez_gene_id,data.uniprot_id,expression_strength,differential_expression_analyte_control,ratio,pvalue,fdr
FROM data INNER JOIN entrez_to_uniprot
ON data.uniprot_id=entrez_to_uniprot.uniprot_id
WHERE entrez_to_uniprot.entrez_id IN (185,655,1490,1636,4087,4088,4089,4092,7040,7046)
AND dataset_id='gse1563_acuterejection'*/

?>