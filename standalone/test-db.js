const { Client } = require('pg');

// Configuração do banco PostgreSQL
const dbConfig = {
  host: '35.199.101.38',
  port: 5432,
  database: 'liberdade-medica',
  user: 'vinilean',
  password: '-Infra55LM-',
  ssl: false,
  connectionTimeoutMillis: 30000,
  query_timeout: 30000,
  statement_timeout: 30000,
  idle_in_transaction_session_timeout: 30000
};

async function testConnection() {
  let client = null;
  
  try {
    console.log('========================================');
    console.log(' TESTE DE CONEXÃO POSTGRESQL');
    console.log('========================================');
    console.log('🔄 Conectando ao PostgreSQL...');
    console.log('Host:', dbConfig.host);
    console.log('Port:', dbConfig.port);
    console.log('Database:', dbConfig.database);
    console.log('User:', dbConfig.user);
    console.log('');
    
    client = new Client(dbConfig);
    await client.connect();
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar consulta básica
    console.log('🔄 Testando consulta básica...');
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Consulta executada:', result.rows[0].current_time);
    console.log('📊 Versão PostgreSQL:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    console.log('');
    
    // Verificar se a tabela existe
    console.log('🔄 Verificando tabela blog_artigos...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_artigos'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Tabela blog_artigos encontrada');
      
      // Verificar estrutura da tabela
      console.log('🔄 Verificando estrutura da tabela...');
      const columnsCheck = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_artigos'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Estrutura da tabela blog_artigos:');
      columnsCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
      console.log('');
      
      // Contar registros
      console.log('🔄 Contando registros...');
      const countResult = await client.query('SELECT COUNT(*) as total FROM public.blog_artigos');
      console.log(`📊 Total de artigos: ${countResult.rows[0].total}`);
      
      // Mostrar alguns registros recentes
      if (parseInt(countResult.rows[0].total) > 0) {
        console.log('🔄 Buscando registros recentes...');
        const recentArticles = await client.query(`
          SELECT id, titulo, categoria, autor, data_criacao, status, created_at
          FROM public.blog_artigos 
          ORDER BY created_at DESC 
          LIMIT 5
        `);
        
        console.log('📄 Artigos recentes:');
        recentArticles.rows.forEach(article => {
          console.log(`  - ID: ${article.id} | ${article.titulo} | ${article.categoria} | ${article.autor}`);
        });
      }
      
    } else {
      console.log('❌ Tabela blog_artigos NÃO encontrada');
      
      // Listar tabelas disponíveis
      console.log('🔄 Listando tabelas disponíveis...');
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      
      console.log('📋 Tabelas disponíveis no schema public:');
      tablesResult.rows.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
    console.log('');
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Detalhes do erro:', error);
  } finally {
    if (client) {
      try {
        await client.end();
        console.log('🔌 Conexão encerrada');
      } catch (err) {
        console.error('❌ Erro ao encerrar conexão:', err.message);
      }
    }
  }
}

// Executar teste
testConnection().then(() => {
  console.log('========================================');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
