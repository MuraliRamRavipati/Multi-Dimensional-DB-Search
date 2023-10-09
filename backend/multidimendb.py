import sys
import graphene
import mysql.connector as mysql

db = mysql.connect(
    host="localhost",
    database="dbweb1",
    user="root",
    passwd="root1234",
    auth_plugin='mysql_native_password'
)
cursor = db.cursor()

class Domain(graphene.ObjectType):
    domainName = graphene.String()
    # factTableName = graphene.String()

class PropertyDetail(graphene.ObjectType):
    allowedValue = graphene.String()
    allowedValueCode = graphene.Int()

class Property(graphene.ObjectType):
    # domainName = graphene.String()
    propertyName = graphene.String()
    propertyQuestion = graphene.String()
    # displayorder = graphene.Int()
    propertyDisplayType = graphene.String()
    propertyDetails = graphene.List(PropertyDetail)

class Result(graphene.ObjectType):
    name = graphene.String()
    url = graphene.String()

class Bookmark(graphene.ObjectType):
    bname = graphene.String()
    bookmark = graphene.String()

class User(graphene.ObjectType):
    userid = graphene.String()

########### QUERIES ################
class Queries(graphene.ObjectType):
    domains = graphene.List(Domain)
    properties = graphene.List(Property, domainName=graphene.String())
    results = graphene.List(Result, domainName=graphene.String(), queryParams=graphene.String())
    bookmarkResults = graphene.List(Result, userid=graphene.String(), domainName=graphene.String(), bookmarkName=graphene.String())
    bookmarks = graphene.List(Bookmark, userid=graphene.String(), domainName=graphene.String())
    user = graphene.List(User, userid=graphene.String())

    def resolve_domains(self, info):
        query = "select domainName from domain"
        cursor.execute(query)
        records = cursor.fetchall()
        domains = []
        for record in records:
            domains.append(Domain(domainName=record[0]))
        return domains

    def resolve_properties(self, info, domainName):
        query = "select p1.propertyName, p1.propertyQuestion, p1.propertyDisplayType, p2.allowedValue, p2.allowedValueCode from dbweb1.property p1 join dbweb1.propertyDetail p2 on p1.domainName = p2.domainName and p1.propertyName=p2.propertyName where p1.domainName='"+domainName+"' order by p1.displayorder, p2.allowedValueCode"
        db2 = mysql.connect(
            host="localhost",
            database="dbweb1",
            user="root",
            passwd="root1234",
            auth_plugin='mysql_native_password'
        )
        cursor2 = db2.cursor()
        cursor2.execute(query)
        records = cursor2.fetchall()
        cursor2.close()
        db2.close()
        properties = []
        propertyDetails = []
        for idx, record in enumerate(records):
            if(idx==len(records)-1 or record[0] != records[idx+1][0]):
                propertyDetails.append(PropertyDetail(allowedValue=record[3],allowedValueCode=record[4]))
                properties.append(Property(propertyName=record[0],propertyQuestion=record[1],propertyDisplayType=record[2],propertyDetails=propertyDetails))
                propertyDetails = []
            else:
                propertyDetails.append(PropertyDetail(allowedValue=record[3],allowedValueCode=record[4]))
        return properties

    def resolve_results(self, info, domainName, queryParams):
        query = ""
        if(len(str(queryParams)) > 0):
            queryParams = str(queryParams).replace(",", " and ").replace(".", " or ").replace(":", "(").replace(";", ")")
            if(domainName=='Colleges'):
                query = "select name, url from collegeFactTable where " + queryParams
            else:
                query = "select autoID, url from autoFactTable where " + queryParams
        else:
            if(domainName=='Colleges'):
                query = "select name, url from collegeFactTable"
            else:
                query = "select autoID, url from autoFactTable"
        print(query)
        cursor.execute(query)
        records = cursor.fetchall()
        results = []
        for record in records:
            results.append(Result(name=record[0],url=record[1]))
        results.append(Result(name="mysql", url=query))
        return results

    def resolve_bookmarkResults(self, info, userid, domainName, bookmarkName):
        query = "select bookmark from userBookmark where userid='"+userid+"' and domainName='"+domainName+"' and bname='"+bookmarkName+"'"
        cursor.execute(query)
        records = cursor.fetchall()
        print(records[0][0])
        queryParams = str(records[0][0]).replace(",", " and ").replace(".", " or ").replace(":", "(").replace(";", ")")
        if(domainName=='Colleges'):
            query = "select name, url from collegeFactTable where " + queryParams
        else:
            query = "select name, url from autoFactTable where " + queryParams
        print(query)
        cursor.execute(query)
        records = cursor.fetchall()
        results = []
        for record in records:
            results.append(Result(name=record[0],url=record[1]))
        results.append(Result(name="mysql", url=query))
        return results
    
    def resolve_bookmarks(self, info, userid, domainName):
        query = "select bname, bookmark from userBookmark where userid='"+userid+"' and domainName='"+domainName+"'"
        db2 = mysql.connect(
            host="localhost",
            database="dbweb1",
            user="root",
            passwd="root1234",
            auth_plugin='mysql_native_password'
        )
        cursor2 = db2.cursor()
        cursor2.execute(query)
        records = cursor2.fetchall()
        cursor2.close()
        db2.close()
        bookmarks = []
        for record in records:
            bookmarks.append(Bookmark(bname=record[0],bookmark=record[1]))
        return bookmarks

    def resolve_user(self, info, userid):
        query = "select userid from user where userid='"+userid+"'"
        cursor.execute(query)        
        records = cursor.fetchall()
        user = []
        for record in records:
            user.append(User(userid=record[0]))
        return user
            
########### MUTATIONS ################
class CreateBookmark(graphene.Mutation):
    # define output of mutation here
    ok = graphene.Boolean()
    userid = graphene.String()
    domainName = graphene.String()
    bname = graphene.String()
    bookmark = graphene.String()
    # define data to be sent to server as part of insert
    class Arguments:
        userid = graphene.String()
        domainName = graphene.String()
        bname = graphene.String()
        bookmark = graphene.String()
    # code to modify database
    def mutate(self, info, userid, domainName, bname, bookmark):
        sql = "insert into userBookmark values ('"+userid+"','"+domainName+"','"+bname+"','"+bookmark+"')"
        try:
            cursor.execute(sql)
            db.commit()
            return CreateBookmark(ok=True,userid=userid,domainName=domainName,bname=bname,bookmark=bookmark)
        except Exception as e:
            print(e)
            db.rollback()
            return CreateBookmark(ok=False,userid="",domainName="",bname="",bookmark="")

class DeleteBookmark(graphene.Mutation):
    # define output of mutation here
    ok = graphene.Boolean()
    userid = graphene.String()
    domainName = graphene.String()
    bname = graphene.String()
    # define data to be sent to server as part of insert
    class Arguments:
        userid = graphene.String()
        domainName = graphene.String()
        bname = graphene.String()
    # code to modify database
    def mutate(self, info, userid, domainName, bname):
        sql = "delete from userBookmark where userid='"+userid+"' and domainName='"+domainName+"' and bname='"+bname+"'"
        try:
            cursor.execute(sql)
            db.commit()
            return DeleteBookmark(ok=True)
        except Exception as e:
            print(e)
            db.rollback()
            return DeleteBookmark(ok=False)

class Mutations(graphene.ObjectType):
    create_bookmark = CreateBookmark.Field()
    delete_bookmark = DeleteBookmark.Field()

schema = graphene.Schema(query=Queries,mutation=Mutations)
